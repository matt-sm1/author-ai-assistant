BEGIN;

DO $$
DECLARE
    author_id_reference OID;
    foreign_key_count INTEGER;
    unmapped_count INTEGER;
    foreign_key_name NAME;
BEGIN
    SELECT
        COUNT(*),
        (ARRAY_AGG(c.confrelid))[1],
        (ARRAY_AGG(c.conname))[1]
    INTO foreign_key_count, author_id_reference, foreign_key_name
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.posts'::regclass
      AND c.contype = 'f'
      AND CARDINALITY(c.conkey) = 1
      AND a.attname = 'author_id';

    IF foreign_key_count <> 1 THEN
        RAISE EXCEPTION
            'Expected exactly one foreign key for posts.author_id; found %. Inspect the database schema before migrating.',
            foreign_key_count;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'posts'
          AND column_name = 'author_id'
          AND is_nullable <> 'NO'
    ) THEN
        RAISE EXCEPTION
            'posts.author_id must remain NOT NULL. Resolve nullable or missing historical attributions before migrating.';
    END IF;

    IF author_id_reference = 'public.authors'::regclass THEN
        IF EXISTS (
            SELECT 1
            FROM public.posts p
            LEFT JOIN public.authors a ON a.id = p.author_id
            WHERE a.id IS NULL
        ) THEN
            RAISE EXCEPTION
                'posts.author_id already references authors, but orphaned values exist. Restore their approved Author attribution before continuing.';
        END IF;

        RETURN;
    END IF;

    IF author_id_reference <> 'public.users'::regclass THEN
        RAISE EXCEPTION
            'posts.author_id references %, not users or authors. Inspect the schema and create an approved migration plan.',
            author_id_reference::regclass;
    END IF;

    SELECT COUNT(*)
    INTO unmapped_count
    FROM (
        SELECT DISTINCT p.author_id
        FROM public.posts p
        LEFT JOIN public.post_author_migration_map m
          ON m.source_user_id = p.author_id
        WHERE m.source_user_id IS NULL
    ) AS unmapped_posts;

    IF unmapped_count > 0 THEN
        RAISE EXCEPTION
            'Cannot migrate posts.author_id: % distinct legacy User attribution(s) have no approved Author mapping. Review each legacy attribution, insert explicit rows into post_author_migration_map (source_user_id, author_id, approved_by), then rerun migrations.',
            unmapped_count
            USING HINT = 'Inspect legacy IDs and existing post authorship with SELECT DISTINCT p.author_id, u.name FROM public.posts p JOIN public.users u ON u.id = p.author_id ORDER BY u.name. Choose the correct existing Author or create one only after review; never infer identity from matching email or UUID.';
    END IF;

    UPDATE public.posts p
    SET author_id = m.author_id
    FROM public.post_author_migration_map m
    WHERE p.author_id = m.source_user_id;

    EXECUTE FORMAT(
        'ALTER TABLE public.posts DROP CONSTRAINT %I',
        foreign_key_name
    );

    ALTER TABLE public.posts
        ADD CONSTRAINT posts_author_id_fkey
        FOREIGN KEY (author_id)
        REFERENCES public.authors(id)
        ON DELETE RESTRICT;
END
$$;

COMMIT;
