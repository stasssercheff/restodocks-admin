import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Live DeepL usage + DeepSeek balance for Restodocks admin AI tab.
 * Also persists DeepSeek /user/balance snapshots (throttled) so admin can
 * chart real prepaid spend without keeping the AI tab open.
 * Auth: service_role (Bearer/apikey string match OR JWT role claim).
 * Keys: DEEPL_AUTH_KEY|DEEPL_API_KEY, DEEPSEEK_API_KEY.
 *
 * Cron (every 5 min): job `deepseek-balance-snapshot` via pg_cron + vault
 * `supabase_service_role_key`.
 */

const SNAPSHOT_MIN_INTERVAL_MS = 2 * 60 * 1000;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function parseBearer(header: string | null): string | null {
  const h = header?.trim();
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

function jwtRole(token: string | null | undefined): string | null {
  if (!token || !token.includes(".")) return null;
  try {
    const payload = token.split(".")[1];
    const jsonStr = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(jsonStr) as { role?: string };
    return typeof data.role === "string" ? data.role : null;
  } catch {
    return null;
  }
}

function isServiceRole(req: Request): boolean {
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  const apiKey = req.headers.get("apikey")?.trim() || null;
  const bearer = parseBearer(
    req.headers.get("authorization") ?? req.headers.get("Authorization"),
  );
  if (service && (apiKey === service || bearer === service)) return true;
  // Vault may still store classic eyJ… service_role JWT while Edge env uses sb_… keys.
  if (jwtRole(bearer) === "service_role" || jwtRole(apiKey) === "service_role") {
    return true;
  }
  return false;
}

function resolveDeeplKey(): string | undefined {
  const key = (
    Deno.env.get("DEEPL_AUTH_KEY") ??
    Deno.env.get("DEEPL_API_KEY") ??
    ""
  ).trim();
  return key || undefined;
}

function deeplUsageUrls(key: string): string[] {
  if (key.includes(":fx")) {
    return [
      "https://api-free.deepl.com/v2/usage",
      "https://api.deepl.com/v2/usage",
    ];
  }
  return [
    "https://api.deepl.com/v2/usage",
    "https://api-free.deepl.com/v2/usage",
  ];
}

async function fetchDeeplUsage() {
  const key = resolveDeeplKey();
  if (!key) {
    return { ok: false as const, error: "deepl_key_missing" };
  }
  let lastStatus = 0;
  let lastBody = "";
  for (const url of deeplUsageUrls(key)) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `DeepL-Auth-Key ${key}`,
          Accept: "application/json",
        },
      });
      lastStatus = res.status;
      lastBody = await res.text();
      if (!res.ok) continue;
      const data = JSON.parse(lastBody) as {
        character_count?: number;
        character_limit?: number;
        api_key_character_count?: number;
        api_key_character_limit?: number;
      };
      const character_count = Number(data.character_count) || 0;
      const character_limit = Number(data.character_limit) || 0;
      const remaining = Math.max(0, character_limit - character_count);
      return {
        ok: true as const,
        usage: {
          character_count,
          character_limit,
          remaining,
          api_key_character_count:
            typeof data.api_key_character_count === "number"
              ? data.api_key_character_count
              : null,
          api_key_character_limit:
            typeof data.api_key_character_limit === "number"
              ? data.api_key_character_limit
              : null,
          host: url.includes("api-free") ? "free" : "pro",
        },
      };
    } catch (e) {
      lastBody = e instanceof Error ? e.message : String(e);
    }
  }
  return {
    ok: false as const,
    error: `deepl_http_${lastStatus || "err"}`,
    detail: lastBody.slice(0, 240),
  };
}

async function fetchDeepseekBalance() {
  const key = Deno.env.get("DEEPSEEK_API_KEY")?.trim();
  if (!key) {
    return { ok: false as const, error: "deepseek_key_missing" };
  }
  try {
    const res = await fetch("https://api.deepseek.com/user/balance", {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false as const,
        error: `deepseek_http_${res.status}`,
        detail: text.slice(0, 240),
      };
    }
    const data = JSON.parse(text) as {
      is_available?: boolean;
      balance_infos?: Array<{
        currency?: string;
        total_balance?: string;
        granted_balance?: string;
        topped_up_balance?: string;
      }>;
    };
    const balances = (data.balance_infos ?? []).map((row) => ({
      currency: String(row.currency ?? ""),
      total_balance: String(row.total_balance ?? "0"),
      granted_balance: String(row.granted_balance ?? "0"),
      topped_up_balance: String(row.topped_up_balance ?? "0"),
    }));
    return {
      ok: true as const,
      balance: {
        is_available: data.is_available !== false,
        balances,
      },
    };
  } catch (e) {
    return {
      ok: false as const,
      error: "deepseek_fetch_failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

function pickPreferredBalance(
  balances: Array<{
    currency: string;
    total_balance: string;
    granted_balance: string;
    topped_up_balance: string;
  }> | undefined,
) {
  if (!balances?.length) return null;
  const usd = balances.find((b) => b.currency.toUpperCase() === "USD");
  return usd ?? balances[0];
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

async function maybeRecordDeepseekSnapshot(
  deepseek: Awaited<ReturnType<typeof fetchDeepseekBalance>>,
  fetchedAt: string,
): Promise<{ recorded: boolean; reason?: string }> {
  if (!deepseek.ok) return { recorded: false, reason: deepseek.error };
  const preferred = pickPreferredBalance(deepseek.balance.balances);
  if (!preferred) return { recorded: false, reason: "no_balance_row" };

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !service) {
    return { recorded: false, reason: "supabase_env_missing" };
  }

  const supabase = createClient(supabaseUrl, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const currency = preferred.currency.toUpperCase() || "USD";
  const current = {
    total_balance: num(preferred.total_balance),
    granted_balance: num(preferred.granted_balance),
    topped_up_balance: num(preferred.topped_up_balance),
  };

  const { data: lastRows, error: lastErr } = await supabase
    .from("provider_balance_snapshots")
    .select("captured_at, total_balance, granted_balance, topped_up_balance")
    .eq("provider", "deepseek")
    .eq("currency", currency)
    .order("captured_at", { ascending: false })
    .limit(1);

  if (lastErr) return { recorded: false, reason: lastErr.message };

  const last = lastRows?.[0] as
    | {
      captured_at: string;
      total_balance: number | string;
      granted_balance: number | string;
      topped_up_balance: number | string;
    }
    | undefined;

  const ageMs = last
    ? Date.parse(fetchedAt) - Date.parse(last.captured_at)
    : Number.POSITIVE_INFINITY;
  const changed = !last
    || Math.abs(num(last.total_balance) - current.total_balance) >= 0.01
    || Math.abs(num(last.topped_up_balance) - current.topped_up_balance) >= 0.01
    || Math.abs(num(last.granted_balance) - current.granted_balance) >= 0.01;

  if (last && ageMs < SNAPSHOT_MIN_INTERVAL_MS && !changed) {
    return { recorded: false, reason: "throttled" };
  }

  const { error: insertErr } = await supabase.from("provider_balance_snapshots").insert({
    provider: "deepseek",
    currency,
    captured_at: fetchedAt,
    total_balance: current.total_balance,
    granted_balance: current.granted_balance,
    topped_up_balance: current.topped_up_balance,
    is_available: deepseek.balance.is_available !== false,
  });

  if (insertErr) return { recorded: false, reason: insertErr.message };
  return { recorded: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }
  if (!isServiceRole(req)) {
    return json({ error: "unauthorized" }, 401);
  }

  const fetchedAt = new Date().toISOString();
  const [deepl, deepseek] = await Promise.all([
    fetchDeeplUsage(),
    fetchDeepseekBalance(),
  ]);

  const snapshot = await maybeRecordDeepseekSnapshot(deepseek, fetchedAt);

  return json({
    fetchedAt,
    deepl,
    deepseek,
    snapshot,
  });
});
