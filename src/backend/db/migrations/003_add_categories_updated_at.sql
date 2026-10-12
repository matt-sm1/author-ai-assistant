-- ============================================
-- ADD UPDATED_AT TO CATEGORIES
-- ============================================

ALTER TABLE categories
ADD COLUMN IF NOT EXISTS updated_at
TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ============================================
-- CATEGORY UPDATED_AT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- CATEGORY UPDATED_AT TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS categories_updated_at_trigger
ON categories;

CREATE TRIGGER categories_updated_at_trigger
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_categories_updated_at();