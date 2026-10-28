-- =============================================================================
-- Expo Customer Storefront Curated Seed — Agent 01 cleanup
-- =============================================================================
-- Soft-delete legacy herbal taxonomy and old storefront demo seed so Shop sidebar
-- is footwear-only before curated catalog (a31*/dddd*/eeee*/4444*) is inserted.
-- Idempotent: guarded by deleted_at IS NULL / active checks.
-- Mirror: asf-2-next/supabase/migrations/ (same filename).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Herbal departments
-- ---------------------------------------------------------------------------
UPDATE public.departments
SET active = false,
    deleted_at = COALESCE(deleted_at, NOW())
WHERE id IN (
  '4e81c815-a81c-4b3b-aa6e-a274dd5537ff', -- 健康与预防
  'd5a053cc-cc9b-449e-9ca4-a53d5e3f52bf', -- 草本医学
  'dc30f462-f90c-4880-8cc7-dd666b8ef20d'  -- 治疗性草本
)
  AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2) Herbal ranges (immune, digestion, stress, cognitive, energy, pain)
-- ---------------------------------------------------------------------------
UPDATE public.ranges
SET active = false,
    deleted_at = COALESCE(deleted_at, NOW())
WHERE department_id IN (
    '4e81c815-a81c-4b3b-aa6e-a274dd5537ff',
    'd5a053cc-cc9b-449e-9ca4-a53d5e3f52bf',
    'dc30f462-f90c-4880-8cc7-dd666b8ef20d'
  )
  AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 3) Herbal brands
-- ---------------------------------------------------------------------------
UPDATE public.brand
SET active = false,
    deleted_at = COALESCE(deleted_at, NOW())
WHERE id IN (
  '16338fd0-4b05-4de7-a1e1-6b9cf5c04d05', -- 传统草本公司
  '65c3aa90-f9c2-4aae-ae82-f85d9eb11b2b', -- 古方本草
  '8d6feba0-be45-4c83-a7e0-b0d79c82319c', -- 山谷草药
  'dda49847-45f4-4490-a771-f2128a95db55', -- 纯草本健康
  'd4242977-3d6e-4fc3-b099-095c2843030c', -- 绿地植物
  'f877052b-8587-47cc-b517-fcf66668531a'  -- 自然药房
)
  AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 4) Old storefront demo taxonomy (a21* / a22* / a23* / a24*)
-- ---------------------------------------------------------------------------
UPDATE public.departments
SET active = false,
    deleted_at = COALESCE(deleted_at, NOW())
WHERE id::text LIKE 'a2100001-24a8-4f00-8000-%'
  AND deleted_at IS NULL;

UPDATE public.ranges
SET active = false,
    deleted_at = COALESCE(deleted_at, NOW())
WHERE id::text LIKE 'a2200001-24a8-4f00-8000-%'
  AND deleted_at IS NULL;

UPDATE public.categories
SET active = false,
    deleted_at = COALESCE(deleted_at, NOW())
WHERE id::text LIKE 'a2300001-24a8-4f00-8000-%'
  AND deleted_at IS NULL;

UPDATE public.brand
SET active = false,
    deleted_at = COALESCE(deleted_at, NOW())
WHERE id::text LIKE 'a2400001-24a8-4f00-8000-%'
  AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 5) Old demo products (bbbbbbbb-1111-1111-1111-*)
-- ---------------------------------------------------------------------------
UPDATE public.products
SET deleted_at = COALESCE(deleted_at, NOW()),
    updated_at = NOW()
WHERE id::text LIKE 'bbbbbbbb-1111-1111-1111-%'
  AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 6) Old demo product colorways (a2500001-* on bbbb products)
-- ---------------------------------------------------------------------------
UPDATE public.product_colors
SET active = false,
    deleted_at = COALESCE(deleted_at, NOW()),
    updated_at = NOW()
WHERE product_id::text LIKE 'bbbbbbbb-1111-1111-1111-%'
  AND deleted_at IS NULL;

UPDATE public.product_colors
SET active = false,
    deleted_at = COALESCE(deleted_at, NOW()),
    updated_at = NOW()
WHERE id::text LIKE 'a2500001-24a8-4f00-8000-%'
  AND deleted_at IS NULL;

-- product_medias has no deleted_at; rows remain but parent products are soft-deleted.

-- ---------------------------------------------------------------------------
-- 7) Old demo posts (cccccccc-1111-1111-1111-*)
-- ---------------------------------------------------------------------------
UPDATE public.posts
SET active = false,
    deleted_at = COALESCE(deleted_at, NOW())
WHERE id::text LIKE 'cccccccc-1111-1111-1111-%'
  AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 8) Old demo promotions (33330000-0000-0000-0000-*)
-- ---------------------------------------------------------------------------
UPDATE public.promotions
SET active = false,
    deleted_at = COALESCE(deleted_at, NOW())
WHERE id::text LIKE '33330000-0000-0000-0000-%'
  AND deleted_at IS NULL;
