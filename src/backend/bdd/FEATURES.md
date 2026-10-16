# BDD features — public blog + CMS split

Executable scenarios live beside this file as `*.bdd.test.js` (Vitest Given/When/Then).

## Feature: Public blog read API

**In order to** power `/` and `/[slug]` without leaking CMS data  
**As a** visitor or marketing client  
**I want** unauthenticated published-only reads

| Scenario | Expectation |
|----------|-------------|
| Anonymous lists posts | `GET /api/public/posts` → 200, `Cache-Control: public…`, no session |
| CMS fields stripped | No `status`, `author_id`, `created_at`, author `id`/`isActive` |
| Paginate + search | `page`/`limit`/`search` forwarded; invalid page → 400 |
| Limit > 50 | 400 |
| Published by slug | 200 + public cache |
| Missing/draft slug | 404 |
| Empty catalog | `data: []` |

## Feature: Published-only visibility

| Scenario | Expectation |
|----------|-------------|
| SQL by slug | `status = published` AND `published_at <= NOW()` |
| List ordering | `ORDER BY published_at DESC` + LIMIT/OFFSET |
| Search escaping | `%` `_` `!` escaped for ILIKE |
| Missing post | Service → 404 |
| Offset math | page 3 limit 10 → offset 20 |

## Feature: Admin auth gate

| Scenario | Expectation |
|----------|-------------|
| No session | `requireAuth` → redirect `/admin/login` (not `/`) |
| Valid session | AuthContext returned |

## Feature: Reserved post slugs

| Scenario | Expectation |
|----------|-------------|
| Reserved set | `admin`, `api`, `login`, `register`, `tinymce`, `blogs`, `_next`, … |
| Title “Admin” | Unique slug becomes `admin-2` (or next free) |

## Feature: Scheduled publish cron

| Scenario | Expectation |
|----------|-------------|
| Bad/missing secret | 401 |
| Unconfigured secret | 500 |
| GET route (Vercel) | 200 + `publishedCount` / `published[]` |
| POST route (external) | Same contract |

## Feature: Site URL helpers

| Scenario | Expectation |
|----------|-------------|
| Default marketing host | AuthorBot marketing Vercel URL |
| Canonical `/blogs` base | `publicPostUrl` uses `NEXT_PUBLIC_SITE_URL` |
| No site URL | Relative `/{slug}` |
