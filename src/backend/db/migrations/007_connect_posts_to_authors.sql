-- Staging table for explicit, human-reviewed mappings when migrating legacy
-- posts.author_id values that referenced users.id. This migration deliberately
-- does not create Authors from Users or infer identity from matching fields.
CREATE TABLE IF NOT EXISTS post_author_migration_map (
    source_user_id UUID PRIMARY KEY,
    author_id UUID NOT NULL
        REFERENCES authors(id)
        ON DELETE RESTRICT,
    approved_by TEXT NOT NULL
        CHECK (BTRIM(approved_by) <> ''),
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
