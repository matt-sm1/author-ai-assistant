-- Media direct-upload lifecycle: pending → ready | failed

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'media_status'
    ) THEN
        CREATE TYPE media_status AS ENUM ('pending', 'ready', 'failed');
    END IF;
END
$$;

ALTER TABLE media
    ADD COLUMN IF NOT EXISTS status media_status NOT NULL DEFAULT 'ready',
    ADD COLUMN IF NOT EXISTS upload_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS content_sha256 CHAR(64);

-- Existing rows are ready (column default). Pending uploads are excluded from library lists.
CREATE INDEX IF NOT EXISTS idx_media_status_created_at
    ON media (status, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_media_pending_expires
    ON media (upload_expires_at)
    WHERE status = 'pending';
