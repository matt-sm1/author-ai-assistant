# Architecture — Author AI Assistant Dashboard

North-star design for this CMS. Layering stays; the trust model and domain policies are rebuilt.

## Keep vs rebuild

| Area | Decision |
|------|----------|
| `route → controller → service → repository` | Keep |
| Frontend feature modules + RTK Query | Keep |
| Adapters (Cloudinary), factories, Yup | Keep shape |
| JWT-only “logged in = admin” | Rebuilt → server sessions + roles |
| Duplicated SSR/API auth | Rebuilt → shared session resolver |
| Scattered delete/publish rules | Rebuilt → `src/backend/policies/` |
| Public self-registration | Rebuilt → bootstrap admin + admin-only user create |
| Microservices / new framework | Do not rebuild |

## Request pipeline

```text
HTTP → authenticate (session cookie) → authorize (role) → controller(AuthContext) → service → repository
```

`AuthContext`: `{ userId, role, email }`

- `withAuth` — any active session user (`admin` | `editor`)
- `withRole('admin')` — admin-only (user create, bootstrap ops)
- SSR `requireAuth()` uses the same session resolver as APIs

## Roles

| Role | Capabilities |
|------|----------------|
| `admin` | Full CMS + create users |
| `editor` | CMS content CRUD (posts, media, categories, tags, authors); cannot create users |

Disabled users (`status = disabled`) fail authentication on every request.

## Sessions

- Table `sessions` (`id`, `user_id`, `expires_at`, `revoked_at`)
- Cookie `session` (HttpOnly, SameSite=Lax, Secure in production) stores opaque session id
- Login creates session; logout revokes it; deleted/disabled users cannot resolve a session

## API surface

| Surface | Auth |
|---------|------|
| `POST /api/auth/login`, `POST /api/auth/logout` | Public |
| `GET /api/auth/me` | Session |
| `POST /api/auth/users` | Admin session (replaces public register) |
| `/api/{posts,media,categories,tags,authors,stats}/*` | Session + role |
| `/api/health` | `HEALTH_SECRET` bearer (or minimal ok if unset in dev) |
| `/api/cron/*` | `CRON_SECRET` |

Future public blog reads go under `/api/public/*` (not mixed into admin CRUD).

## Domain policies

Owned by `src/backend/policies/`:

- Delete author/category: block if posts reference them
- Delete tag: block if used unless `force=true`
- Tags on post write: upsert by **slug**
- Media delete: storage then DB; missing → 404
- Featured media: null clears; UUID must exist
- Publish: content required for published/scheduled; scheduled needs future `publishedAt`; published + future date → treated as scheduled

## Cross-cutting

- `assertSafePagination(page, limit)` on all list endpoints
- Single cookie helpers in `auth-cookie.js`
- JSON success envelope `{ success, message?, data?, pagination? }` retained for CMS resources
- `GET /api/stats` for dashboard totals (no client `limit: 100` counting)
- Users store credentials in `password_hash` (migration `010_rename_password_to_password_hash.sql`)
- Unit tests: `npm test` (policies, auth middleware roles, pagination, secure compare, public register disabled)
