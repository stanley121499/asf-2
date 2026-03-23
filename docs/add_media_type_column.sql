-- ============================================================
-- STEP 1: Add media_type column to post_medias table
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE post_medias
ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image'
CHECK (media_type IN ('image', 'video'));

-- ============================================================
-- STEP 2: Bulk-update ALL existing rows automatically.
-- Uses Supabase storage.objects table which stores the real
-- MIME type of every uploaded file  no manual ID needed.
-- ============================================================

UPDATE post_medias pm
SET media_type = 'video'
FROM storage.objects so
WHERE
  so.bucket_id = 'post_medias'
  AND so.name = split_part(pm.media_url, '/post_medias/', 2)
  AND (
    so.metadata->>'mimetype' LIKE 'video/%'
    OR so.metadata->>'content-type' LIKE 'video/%'
  );

-- ============================================================
-- STEP 3: Verify  should show media_type = 'video' for videos
-- and 'image' for everything else.
-- ============================================================

SELECT
  pm.id,
  pm.media_type,
  pm.media_url,
  so.metadata->>'mimetype' AS storage_mimetype
FROM post_medias pm
LEFT JOIN storage.objects so
  ON so.bucket_id = 'post_medias'
  AND so.name = split_part(pm.media_url, '/post_medias/', 2)
ORDER BY pm.created_at DESC
LIMIT 30;
