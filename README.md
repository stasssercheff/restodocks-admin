# Restodocks Admin

Admin panel for Restodocks. **Hosted only on Cloudflare Workers** — not Vercel.

- Production: https://restodocks-admin.stassserchef.workers.dev
- Stack: Next.js + OpenNext (`@opennextjs/cloudflare`) + Wrangler

## Do not use Vercel

Vercel is **forbidden** for this project. Do not deploy, configure, or suggest Vercel. Ignore any old Vercel commit statuses on GitHub.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` → `.env.local` and fill Supabase + `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Admin accounts

Login is email + password. The owner is the `ADMIN_EMAIL` + `ADMIN_PASSWORD` pair (Cloudflare Worker secrets). Staff accounts live in Supabase table `admin_panel_users`.

1. In the Supabase SQL editor run `supabase/migrations/20260917_admin_panel_users.sql`.
2. Log in as owner.
3. Open **Сотрудники**, create an email/password, and tick which tabs that person can see (Заведения, Промокоды). Future admin pages are added to `ADMIN_PAGES` in `lib/admin-pages.ts` and automatically appear as checkboxes.
4. That person logs in and only sees granted tabs. APIs for other tabs return 403.

If `ADMIN_EMAIL` is not set yet, the current `ADMIN_PASSWORD` still logs in as owner with whatever email you type — set `ADMIN_EMAIL` in Worker secrets when you can.

## Deploy (Cloudflare Workers)

```bash
npm run deploy
```

Or push to `main` — GitHub Action `.github/workflows/deploy-cloudflare.yml` builds OpenNext and deploys the Worker.

Required GitHub / CI secrets (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` — **required**; without it every deploy fails
- `CLOUDFLARE_ACCOUNT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Worker runtime secrets (Cloudflare dashboard → Workers & Pages → `restodocks-admin` → Settings → Variables and Secrets):

- `ADMIN_PASSWORD`
- `ADMIN_EMAIL` — owner login
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL` (или `NEXT_PUBLIC_SUPABASE_URL`) — URL проекта Supabase, вида `https://xxxx.supabase.co`
- optionally `NEXT_PUBLIC_SUPABASE_ANON_KEY`
