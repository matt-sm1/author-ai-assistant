-- ============================================
-- POST STATUS
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'post_status'
    ) THEN
        CREATE TYPE post_status AS ENUM (
            'draft',
            'published',
            'scheduled'
        );
    END IF;
END
$$;


-- ============================================
-- CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================
-- TAGS
-- ============================================

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================
-- POSTS
-- ============================================

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,

    content TEXT,
    excerpt TEXT,
    
    featured_media_id UUID
        REFERENCES media(id)
        ON DELETE SET NULL,

    featured_image TEXT,


    status post_status NOT NULL DEFAULT 'draft',

    published_at TIMESTAMPTZ,

    category_id UUID
        REFERENCES categories(id)
        ON DELETE SET NULL,

    author_id UUID NOT NULL
        REFERENCES users(id),

    seo_title TEXT,
    meta_description VARCHAR(160),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================
-- POST TAGS
-- ============================================

CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID NOT NULL
        REFERENCES posts(id)
        ON DELETE CASCADE,

    tag_id UUID NOT NULL
        REFERENCES tags(id)
        ON DELETE CASCADE,

    PRIMARY KEY (post_id, tag_id)
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_posts_status_published_at
    ON posts(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_category_id
    ON posts(category_id);

CREATE INDEX IF NOT EXISTS idx_posts_author_id
    ON posts(author_id);

CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id
    ON post_tags(tag_id);


-- ============================================
-- UPDATED AT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- UPDATED AT TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS posts_updated_at_trigger ON posts;

CREATE TRIGGER posts_updated_at_trigger
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_posts_updated_at();
