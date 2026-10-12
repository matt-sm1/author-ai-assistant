-- ============================================
-- ADD UPDATED_AT TO TAGS
-- ============================================

ALTER TABLE tags
ADD COLUMN IF NOT EXISTS updated_at
TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ============================================
-- UPDATED_AT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS tags_updated_at_trigger ON tags;

CREATE TRIGGER tags_updated_at_trigger
BEFORE UPDATE ON tags
FOR EACH ROW
EXECUTE FUNCTION update_tags_updated_at();