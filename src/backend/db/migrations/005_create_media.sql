-- ============================================
-- MEDIA LIBRARY
-- ============================================

CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Storage provider information
    storage_provider TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    provider_asset_id TEXT,

    -- File URL
    url TEXT NOT NULL,

    -- File information
    filename TEXT NOT NULL,
    resource_type TEXT NOT NULL
        CHECK (resource_type IN ('image', 'video')),

    mime_type TEXT NOT NULL,
    format TEXT NOT NULL,

    size_bytes BIGINT NOT NULL
        CHECK (size_bytes > 0),

    width INTEGER CHECK (width IS NULL OR width > 0),
    height INTEGER CHECK (height IS NULL OR height > 0),

    -- SEO and media metadata
    alt_text TEXT,
    caption TEXT,
    description TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate assets within a provider
    UNIQUE (storage_provider, storage_key)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_media_created_at
ON media (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_media_resource_type
ON media (resource_type);

-- ============================================
-- UPDATED AT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- UPDATED AT TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS media_updated_at_trigger ON media;

CREATE TRIGGER media_updated_at_trigger
BEFORE UPDATE ON media
FOR EACH ROW
EXECUTE FUNCTION update_media_updated_at();