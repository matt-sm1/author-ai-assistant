
CREATE TABLE IF NOT EXISTS authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE,
    bio TEXT,

    avatar_media_id UUID
        REFERENCES media(id)
        ON DELETE SET NULL,

    avatar_url TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_authors_avatar_media_id
ON authors (avatar_media_id);
