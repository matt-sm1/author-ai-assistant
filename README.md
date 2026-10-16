This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the target trust model (server sessions + roles), API surfaces, and domain policies.

## Auth bootstrap

Public self-registration is disabled. Create the first admin via env:

```bash
# .env.local (required) — see .env.example
DATABASE_URL=postgresql://...
BOOTSTRAP_ADMIN_EMAIL=admin
BOOTSTRAP_ADMIN_PASSWORD=admin123
BOOTSTRAP_ADMIN_NAME=Admin
# plus JWT_SECRET / CRON_SECRET / Hostinger (or Cloudinary) as needed
```

Login with username **`admin`** and password **`admin123`** (after bootstrap). Change these in production.

```bash
npm install
npm run setup:db    # migrate (incl. password_hash + sessions + media lifecycle) then bootstrap admin
npm run dev
```

`npm run bootstrap` alone creates the admin if none exist (same as first login bootstrap). Further users: `POST /api/auth/users` (admin session).

Cookie name is `session` (opaque DB session id). Password column is `password_hash`. Set `HEALTH_SECRET` to require a bearer token for detailed `/api/health`.

### Media storage (Hostinger)

Default `STORAGE_PROVIDER=hostinger`. Uploads go **Browser → Hostinger** with HMAC tickets; Vercel only creates sessions and finalizes DB rows.

1. Deploy PHP from [`hostinger-media-api/`](./hostinger-media-api/) via FTP (see that folder’s README).
2. Set Vercel env: `HOSTINGER_PUBLIC_BASE_URL`, `HOSTINGER_MEDIA_API_BASE_URL`, `HOSTINGER_MEDIA_SIGNING_SECRET` (same secret as Hostinger `config.php`).
3. Redeploy. Cron `/api/cron/media-orphan-cleanup` sweeps expired pending uploads (`CRON_SECRET`).

FTP credentials are **not** runtime env — deploy-time only.

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
