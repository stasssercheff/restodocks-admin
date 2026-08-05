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

Copy `.env.example` → `.env.local` and fill Supabase + admin password.

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

Worker runtime secrets (Cloudflare dashboard / `wrangler secret`):

- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- plus the same `NEXT_PUBLIC_*` if not baked at build time
