# AuthorBot blog + CMS

Public **blog** at `/` and `/[slug]`; staff **CMS** at `/admin` (login at `/admin/login`).

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for sessions/roles, public vs CMS APIs, and domain policies.

## Public blog vs admin

| URL | Purpose |
|-----|---------|
| `/` | Published articles listing (AuthorBot marketing header/footer) |
| `/[slug]` | Published article |
| `/admin/login` | Staff login |
| `/admin` | Dashboard / CMS |

Unauthenticated reads: `GET /api/public/posts` and `GET /api/public/posts/[slug]` (published only). CMS CRUD stays under `/api/posts` with a session.

Env for chrome + SEO:

- `NEXT_PUBLIC_MARKETING_SITE_URL` — `https://authoraiassistant.com`
- `NEXT_PUBLIC_SITE_URL` — `https://authoraiassistant.com/blogs`

### Marketing site rewrite (`/blogs` → this app)

This app uses Next.js `basePath: "/blogs"`. The **marketing** site (`ai-author-assistant-website`) proxies:

```json
{
  "rewrites": [
    {
      "source": "/blogs",
      "destination": "https://author-ai-assistant.vercel.app/blogs"
    },
    {
      "source": "/blogs/:path*",
      "destination": "https://author-ai-assistant.vercel.app/blogs/:path*"
    }
  ]
}
```

Public blog: `https://authoraiassistant.com/blogs` · CMS: `https://authoraiassistant.com/blogs/admin/login`  
Cron targets this deployment: `/blogs/api/cron/*` (with `CRON_SECRET`).

## Auth bootstrap

Public self-registration is disabled. Create the first admin via env:

```bash
# .env.local (required) — see .env.example
DATABASE_URL=postgresql://...
BOOTSTRAP_ADMIN_EMAIL=admin
BOOTSTRAP_ADMIN_PASSWORD=admin123
BOOTSTRAP_ADMIN_NAME=Admin
# plus JWT_SECRET / CRON_SECRET / Hostinger media env as needed
```

Open `/admin/login` with username **`admin`** and password **`admin123`** (after bootstrap). Change these in production.

```bash
npm install
npm run setup:db    # migrate (incl. password_hash + sessions + media lifecycle) then bootstrap admin
npm run dev
```

Public blog: [http://localhost:3000](http://localhost:3000) · CMS: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

`npm run bootstrap` alone creates the admin if none exist (same as first login bootstrap). Further users: `POST /api/auth/users` (admin session).

Cookie name is `session` (opaque DB session id). Password column is `password_hash`. Set `HEALTH_SECRET` to require a bearer token for detailed `/api/health`.

### Media storage (Hostinger)

Default `STORAGE_PROVIDER=hostinger`. Uploads go **Browser → Hostinger** with HMAC tickets; Vercel only creates sessions and finalizes DB rows.

1. Deploy PHP from [`hostinger-media-api/`](./hostinger-media-api/) via FTP (see that folder’s README).
2. Set Vercel env: `HOSTINGER_PUBLIC_BASE_URL`, `HOSTINGER_MEDIA_API_BASE_URL`, `HOSTINGER_MEDIA_SIGNING_SECRET` (same secret as Hostinger `config.php`).
3. Redeploy. Cron `/api/cron/media-orphan-cleanup` sweeps expired pending uploads (`CRON_SECRET`).

FTP credentials are **not** runtime env — deploy-time only.

### Scheduled posts

1. In the editor, set a future **Schedule date and time** (Pakistan Standard Time, UTC+5) and click **Schedule**.
2. Rows stay `scheduled` until cron flips them to `published` when `published_at <= now`.
3. Vercel Hobby runs [`/api/cron/publish-scheduled`](./src/app/api/cron/publish-scheduled/route.js) **once daily** (`0 0 * * *` UTC) via GET + `Authorization: Bearer $CRON_SECRET`.
4. For nearer-to-time publishing on Hobby, point an external scheduler (e.g. cron-job.org) every **15 minutes** at the same URL with the same Bearer header (GET or POST). Never expose `CRON_SECRET` to the browser.

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://<your-prod-host>/api/cron/publish-scheduled"
```

```bash
npm test            # authz + policy + media ticket unit tests
```

## Getting Started

For the category backend flow, authenticated API routes, validation rules, database behavior, and smoke tests, see [CATEGORY-MODULE.md](./CATEGORY-MODULE.md).

For auth history notes, see [AUTHENTICATION.md](./AUTHENTICATION.md) (superseded in part by ARCHITECTURE.md).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Deploy

Deploy this app to Vercel as today. Point marketing `/blogs` rewrites at the production URL when ready. Keep `CRON_SECRET` and Hostinger env on **this** project.
