# Hostinger media API

Direct-upload endpoints for the Blog CMS. Deploy via FTP **once**; the Next.js app never uses FTP at runtime.

## Layout on Hostinger

```
public_html/
  media-api/          ← copy PHP files here
    config.php        ← from config.sample.php
    lib.php
    session_init.php
    chunk.php
    complete.php
    upload.php
    delete.php
  media/              ← create empty; copy media/.htaccess here
    .htaccess
```

## Setup

1. Copy `config.sample.php` → `config.php` and set:
   - `signing_secret` = same as Vercel `HOSTINGER_MEDIA_SIGNING_SECRET`
   - `public_base_url` = `https://your-cdn-domain.com`
   - `media_root` = absolute path to `public_html/media`
   - `cors_origins` = your Vercel app origin(s), comma-separated
2. Ensure `media/` is web-accessible at `{public_base_url}/media/...`
3. On Vercel set:
   - `STORAGE_PROVIDER=hostinger`
   - `HOSTINGER_PUBLIC_BASE_URL`
   - `HOSTINGER_MEDIA_API_BASE_URL` = `https://your-cdn-domain.com/media-api`
   - `HOSTINGER_MEDIA_SIGNING_SECRET`
4. Redeploy the Next.js app after env changes.

## Endpoints

| File | Role |
|------|------|
| `upload.php` | Single-shot upload (small files) |
| `session_init.php` + `chunk.php` + `complete.php` | Chunked large uploads |
| `delete.php` | Server delete with HMAC token |

All upload endpoints require a Vercel-issued HMAC ticket (`X-Upload-Ticket` or form field).
