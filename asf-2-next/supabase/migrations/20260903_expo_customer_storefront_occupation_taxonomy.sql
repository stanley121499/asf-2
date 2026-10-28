-- =============================================================================
-- Expo Customer Storefront — Occupation taxonomy spine (Agent 01)
-- =============================================================================
-- Adds categories.kind_key; soft-retires curated footwear ranges/categories from
-- active Storefront browse; seeds ≥3 occupations × shoes/bags/accessories;
-- remaps sensible products; leaves unclear SKUs unassigned; covers posts per kind.
-- Idempotent: fixed UUIDs + guards on deleted_at / ON CONFLICT.
-- Dual-path mirror: asf-2-next/supabase/migrations/ (same filename).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Schema: kind_key on categories
-- ---------------------------------------------------------------------------
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS kind_key text;

CREATE INDEX IF NOT EXISTS categories_kind_key_active_idx
  ON public.categories (kind_key)
  WHERE deleted_at IS NULL AND active IS DISTINCT FROM false AND kind_key IS NOT NULL;

COMMENT ON COLUMN public.categories.kind_key IS
  'Stable English product-type slug shared across occupations (e.g. shoes, bags, accessories). Home filter chips use distinct kind_key values.';

-- ---------------------------------------------------------------------------
-- 2) Soft-retire active footwear ranges + categories (curated a32*/a33*)
-- ---------------------------------------------------------------------------
UPDATE public.categories
SET
  deleted_at = COALESCE(deleted_at, NOW()),
  active = false
WHERE id IN (
  'a3300001-24a8-4f00-8000-000000000001',
  'a3300001-24a8-4f00-8000-000000000002',
  'a3300001-24a8-4f00-8000-000000000003',
  'a3300001-24a8-4f00-8000-000000000004',
  'a3300001-24a8-4f00-8000-000000000005',
  'a3300001-24a8-4f00-8000-000000000006',
  'a3300001-24a8-4f00-8000-000000000007',
  'a3300001-24a8-4f00-8000-000000000008',
  'a3300001-24a8-4f00-8000-000000000009',
  'a3300001-24a8-4f00-8000-000000000010',
  'a3300001-24a8-4f00-8000-000000000011',
  'a3300001-24a8-4f00-8000-000000000012'
)
  AND deleted_at IS NULL;

UPDATE public.ranges
SET
  deleted_at = COALESCE(deleted_at, NOW()),
  active = false
WHERE id IN (
  'a3200001-24a8-4f00-8000-000000000001',
  'a3200001-24a8-4f00-8000-000000000002',
  'a3200001-24a8-4f00-8000-000000000003',
  'a3200001-24a8-4f00-8000-000000000004',
  'a3200001-24a8-4f00-8000-000000000005',
  'a3200001-24a8-4f00-8000-000000000006'
)
  AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 3) Occupation ranges (a4200001-*) — department_id NULL
-- ---------------------------------------------------------------------------
-- Nurse / Electrician / Chef — zh on name; media reused from footwear seed.
INSERT INTO public.ranges (id, name, active, media_url, department_id, created_at) VALUES
  (
    'a4200001-24a8-4f00-8000-000000000001',
    '护士',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000005.webp',
    NULL,
    NOW()
  ),
  (
    'a4200001-24a8-4f00-8000-000000000002',
    '电工',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000004.webp',
    NULL,
    NOW()
  ),
  (
    'a4200001-24a8-4f00-8000-000000000003',
    '厨师',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000006.webp',
    NULL,
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  active = true,
  media_url = EXCLUDED.media_url,
  department_id = NULL,
  deleted_at = NULL;

INSERT INTO public.range_translations (range_id, locale, name) VALUES
  ('a4200001-24a8-4f00-8000-000000000001', 'en', 'Nurse'),
  ('a4200001-24a8-4f00-8000-000000000001', 'ms', 'Jururawat'),
  ('a4200001-24a8-4f00-8000-000000000002', 'en', 'Electrician'),
  ('a4200001-24a8-4f00-8000-000000000002', 'ms', 'Jurutera elektrik'),
  ('a4200001-24a8-4f00-8000-000000000003', 'en', 'Chef'),
  ('a4200001-24a8-4f00-8000-000000000003', 'ms', 'Chef')
ON CONFLICT (range_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 4) Categories: each occupation × kind_key (a4300001-*)
-- ---------------------------------------------------------------------------
-- Arrangement: 1 shoes, 2 bags, 3 accessories per occupation.
-- Coming soon fixtures (zero products after remap):
--   Electrician × accessories (…000006)
--   Chef × bags (…000008)
INSERT INTO public.categories (
  id, name, active, media_url, arrangement, range_id, kind_key, created_at
) VALUES
  -- Nurse
  (
    'a4300001-24a8-4f00-8000-000000000001',
    '鞋履',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000001.webp',
    1,
    'a4200001-24a8-4f00-8000-000000000001',
    'shoes',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000002',
    '包袋',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000009.webp',
    2,
    'a4200001-24a8-4f00-8000-000000000001',
    'bags',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000003',
    '配件',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000010.webp',
    3,
    'a4200001-24a8-4f00-8000-000000000001',
    'accessories',
    NOW()
  ),
  -- Electrician
  (
    'a4300001-24a8-4f00-8000-000000000004',
    '鞋履',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000004.webp',
    1,
    'a4200001-24a8-4f00-8000-000000000002',
    'shoes',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000005',
    '包袋',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000009.webp',
    2,
    'a4200001-24a8-4f00-8000-000000000002',
    'bags',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000006',
    '配件',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000012.webp',
    3,
    'a4200001-24a8-4f00-8000-000000000002',
    'accessories',
    NOW()
  ),
  -- Chef
  (
    'a4300001-24a8-4f00-8000-000000000007',
    '鞋履',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000006.webp',
    1,
    'a4200001-24a8-4f00-8000-000000000003',
    'shoes',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000008',
    '包袋',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000009.webp',
    2,
    'a4200001-24a8-4f00-8000-000000000003',
    'bags',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000009',
    '配件',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000012.webp',
    3,
    'a4200001-24a8-4f00-8000-000000000003',
    'accessories',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  active = true,
  media_url = EXCLUDED.media_url,
  arrangement = EXCLUDED.arrangement,
  range_id = EXCLUDED.range_id,
  kind_key = EXCLUDED.kind_key,
  deleted_at = NULL;

INSERT INTO public.category_translations (category_id, locale, name) VALUES
  -- Nurse
  ('a4300001-24a8-4f00-8000-000000000001', 'en', 'Shoes'),
  ('a4300001-24a8-4f00-8000-000000000001', 'ms', 'Kasut'),
  ('a4300001-24a8-4f00-8000-000000000002', 'en', 'Bags'),
  ('a4300001-24a8-4f00-8000-000000000002', 'ms', 'Beg'),
  ('a4300001-24a8-4f00-8000-000000000003', 'en', 'Accessories'),
  ('a4300001-24a8-4f00-8000-000000000003', 'ms', 'Aksesori'),
  -- Electrician
  ('a4300001-24a8-4f00-8000-000000000004', 'en', 'Shoes'),
  ('a4300001-24a8-4f00-8000-000000000004', 'ms', 'Kasut'),
  ('a4300001-24a8-4f00-8000-000000000005', 'en', 'Bags'),
  ('a4300001-24a8-4f00-8000-000000000005', 'ms', 'Beg'),
  ('a4300001-24a8-4f00-8000-000000000006', 'en', 'Accessories'),
  ('a4300001-24a8-4f00-8000-000000000006', 'ms', 'Aksesori'),
  -- Chef
  ('a4300001-24a8-4f00-8000-000000000007', 'en', 'Shoes'),
  ('a4300001-24a8-4f00-8000-000000000007', 'ms', 'Kasut'),
  ('a4300001-24a8-4f00-8000-000000000008', 'en', 'Bags'),
  ('a4300001-24a8-4f00-8000-000000000008', 'ms', 'Beg'),
  ('a4300001-24a8-4f00-8000-000000000009', 'en', 'Accessories'),
  ('a4300001-24a8-4f00-8000-000000000009', 'ms', 'Aksesori')
ON CONFLICT (category_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 5) Clear prior taxonomy FKs on published products, then remap sensible SKUs
-- ---------------------------------------------------------------------------
-- Unassigned first: null range/category so Home All still includes them.
UPDATE public.products
SET
  range_id = NULL,
  category_id = NULL,
  department_id = NULL
WHERE deleted_at IS NULL
  AND status = 'Published'
  AND (
    range_id IN (
      'a3200001-24a8-4f00-8000-000000000001',
      'a3200001-24a8-4f00-8000-000000000002',
      'a3200001-24a8-4f00-8000-000000000003',
      'a3200001-24a8-4f00-8000-000000000004',
      'a3200001-24a8-4f00-8000-000000000005',
      'a3200001-24a8-4f00-8000-000000000006',
      'a4200001-24a8-4f00-8000-000000000001',
      'a4200001-24a8-4f00-8000-000000000002',
      'a4200001-24a8-4f00-8000-000000000003'
    )
    OR category_id IN (
      'a3300001-24a8-4f00-8000-000000000001',
      'a3300001-24a8-4f00-8000-000000000002',
      'a3300001-24a8-4f00-8000-000000000003',
      'a3300001-24a8-4f00-8000-000000000004',
      'a3300001-24a8-4f00-8000-000000000005',
      'a3300001-24a8-4f00-8000-000000000006',
      'a3300001-24a8-4f00-8000-000000000007',
      'a3300001-24a8-4f00-8000-000000000008',
      'a3300001-24a8-4f00-8000-000000000009',
      'a3300001-24a8-4f00-8000-000000000010',
      'a3300001-24a8-4f00-8000-000000000011',
      'a3300001-24a8-4f00-8000-000000000012',
      'a4300001-24a8-4f00-8000-000000000001',
      'a4300001-24a8-4f00-8000-000000000002',
      'a4300001-24a8-4f00-8000-000000000003',
      'a4300001-24a8-4f00-8000-000000000004',
      'a4300001-24a8-4f00-8000-000000000005',
      'a4300001-24a8-4f00-8000-000000000006',
      'a4300001-24a8-4f00-8000-000000000007',
      'a4300001-24a8-4f00-8000-000000000008',
      'a4300001-24a8-4f00-8000-000000000009'
    )
  );

-- Drop join rows that pointed at soft-retired or occupation categories (rebuild below).
DELETE FROM public.product_categories
WHERE category_id IN (
  'a3300001-24a8-4f00-8000-000000000001',
  'a3300001-24a8-4f00-8000-000000000002',
  'a3300001-24a8-4f00-8000-000000000003',
  'a3300001-24a8-4f00-8000-000000000004',
  'a3300001-24a8-4f00-8000-000000000005',
  'a3300001-24a8-4f00-8000-000000000006',
  'a3300001-24a8-4f00-8000-000000000007',
  'a3300001-24a8-4f00-8000-000000000008',
  'a3300001-24a8-4f00-8000-000000000009',
  'a3300001-24a8-4f00-8000-000000000010',
  'a3300001-24a8-4f00-8000-000000000011',
  'a3300001-24a8-4f00-8000-000000000012',
  'a4300001-24a8-4f00-8000-000000000001',
  'a4300001-24a8-4f00-8000-000000000002',
  'a4300001-24a8-4f00-8000-000000000003',
  'a4300001-24a8-4f00-8000-000000000004',
  'a4300001-24a8-4f00-8000-000000000005',
  'a4300001-24a8-4f00-8000-000000000006',
  'a4300001-24a8-4f00-8000-000000000007',
  'a4300001-24a8-4f00-8000-000000000008',
  'a4300001-24a8-4f00-8000-000000000009'
);

-- Helper: map product id → occupation range + category, then insert product_categories.
-- Nurse shoes: former 跑鞋 + 一脚蹬 (comfort / easy on-off for shifts)
UPDATE public.products SET
  range_id = 'a4200001-24a8-4f00-8000-000000000001',
  category_id = 'a4300001-24a8-4f00-8000-000000000001'
WHERE id IN (
  'dddd0101-24a8-4f00-8000-000000000001',
  'dddd0102-24a8-4f00-8000-000000000002',
  'dddd0103-24a8-4f00-8000-000000000003',
  'dddd0104-24a8-4f00-8000-000000000004',
  'dddd0105-24a8-4f00-8000-000000000005',
  'dddd0106-24a8-4f00-8000-000000000006',
  'dddd0107-24a8-4f00-8000-000000000007',
  'dddd0108-24a8-4f00-8000-000000000008',
  'dddd0501-24a8-4f00-8000-000000000001',
  'dddd0502-24a8-4f00-8000-000000000002',
  'dddd0503-24a8-4f00-8000-000000000003',
  'dddd0504-24a8-4f00-8000-000000000004',
  'dddd0505-24a8-4f00-8000-000000000005',
  'dddd0506-24a8-4f00-8000-000000000006',
  'dddd0507-24a8-4f00-8000-000000000007',
  'dddd0508-24a8-4f00-8000-000000000008'
)
  AND deleted_at IS NULL;

-- Electrician shoes: former 男靴 + work-leaning 短靴
UPDATE public.products SET
  range_id = 'a4200001-24a8-4f00-8000-000000000002',
  category_id = 'a4300001-24a8-4f00-8000-000000000004'
WHERE id IN (
  'dddd0401-24a8-4f00-8000-000000000001',
  'dddd0402-24a8-4f00-8000-000000000002',
  'dddd0403-24a8-4f00-8000-000000000003',
  'dddd0404-24a8-4f00-8000-000000000004',
  'dddd0405-24a8-4f00-8000-000000000005',
  'dddd0406-24a8-4f00-8000-000000000006',
  'dddd0407-24a8-4f00-8000-000000000007',
  'dddd0408-24a8-4f00-8000-000000000008',
  'dddd0701-24a8-4f00-8000-000000000001',
  'dddd0704-24a8-4f00-8000-000000000004',
  'dddd0707-24a8-4f00-8000-000000000007'
)
  AND deleted_at IS NULL;

-- Chef shoes: former 休闲运动鞋 (kitchen-floor casual)
UPDATE public.products SET
  range_id = 'a4200001-24a8-4f00-8000-000000000003',
  category_id = 'a4300001-24a8-4f00-8000-000000000007'
WHERE id IN (
  'dddd0601-24a8-4f00-8000-000000000001',
  'dddd0602-24a8-4f00-8000-000000000002',
  'dddd0603-24a8-4f00-8000-000000000003',
  'dddd0604-24a8-4f00-8000-000000000004',
  'dddd0605-24a8-4f00-8000-000000000005',
  'dddd0606-24a8-4f00-8000-000000000006',
  'dddd0607-24a8-4f00-8000-000000000007',
  'dddd0608-24a8-4f00-8000-000000000008'
)
  AND deleted_at IS NULL;

-- Nurse bags: tote / crossbody / clutch
UPDATE public.products SET
  range_id = 'a4200001-24a8-4f00-8000-000000000001',
  category_id = 'a4300001-24a8-4f00-8000-000000000002'
WHERE id IN (
  'dddd0901-24a8-4f00-8000-000000000001',
  'dddd0902-24a8-4f00-8000-000000000002',
  'dddd0904-24a8-4f00-8000-000000000004'
)
  AND deleted_at IS NULL;

-- Electrician bags: backpack only (Chef bags intentionally empty)
UPDATE public.products SET
  range_id = 'a4200001-24a8-4f00-8000-000000000002',
  category_id = 'a4300001-24a8-4f00-8000-000000000005'
WHERE id = 'dddd0903-24a8-4f00-8000-000000000003'
  AND deleted_at IS NULL;

-- Nurse accessories: caps & socks
UPDATE public.products SET
  range_id = 'a4200001-24a8-4f00-8000-000000000001',
  category_id = 'a4300001-24a8-4f00-8000-000000000003'
WHERE id IN (
  'dddd1001-24a8-4f00-8000-000000000001',
  'dddd1002-24a8-4f00-8000-000000000002',
  'dddd1003-24a8-4f00-8000-000000000003',
  'dddd1004-24a8-4f00-8000-000000000004'
)
  AND deleted_at IS NULL;

-- Chef accessories: belts (Electrician accessories intentionally empty)
UPDATE public.products SET
  range_id = 'a4200001-24a8-4f00-8000-000000000003',
  category_id = 'a4300001-24a8-4f00-8000-000000000009'
WHERE id IN (
  'dddd1201-24a8-4f00-8000-000000000001',
  'dddd1202-24a8-4f00-8000-000000000002'
)
  AND deleted_at IS NULL;

-- Rebuild product_categories for remapped products (idempotent on product+category).
INSERT INTO public.product_categories (product_id, category_id, created_at, updated_at)
SELECT
  p.id,
  p.category_id,
  NOW(),
  NOW()
FROM public.products p
WHERE p.deleted_at IS NULL
  AND p.status = 'Published'
  AND p.category_id IN (
    'a4300001-24a8-4f00-8000-000000000001',
    'a4300001-24a8-4f00-8000-000000000002',
    'a4300001-24a8-4f00-8000-000000000003',
    'a4300001-24a8-4f00-8000-000000000004',
    'a4300001-24a8-4f00-8000-000000000005',
    'a4300001-24a8-4f00-8000-000000000007',
    'a4300001-24a8-4f00-8000-000000000009'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.product_categories pc
    WHERE pc.product_id = p.id
      AND pc.category_id = p.category_id
  );

-- ---------------------------------------------------------------------------
-- 6) Posts: ≥1 per kind_key for Home hero filter testing
-- ---------------------------------------------------------------------------
-- shoes → Nurse shoes category; bags → Nurse bags; accessories → Nurse accessories
UPDATE public.posts
SET
  category_id = 'a4300001-24a8-4f00-8000-000000000001',
  range_id = 'a4200001-24a8-4f00-8000-000000000001',
  department_id = NULL
WHERE id = 'eeee0001-24a8-4f00-8000-000000000003'
  AND deleted_at IS NULL;

UPDATE public.posts
SET
  category_id = 'a4300001-24a8-4f00-8000-000000000002',
  range_id = 'a4200001-24a8-4f00-8000-000000000001',
  department_id = NULL
WHERE id = 'eeee0001-24a8-4f00-8000-000000000009'
  AND deleted_at IS NULL;

UPDATE public.posts
SET
  category_id = 'a4300001-24a8-4f00-8000-000000000003',
  range_id = 'a4200001-24a8-4f00-8000-000000000001',
  department_id = NULL
WHERE id = 'eeee0001-24a8-4f00-8000-000000000008'
  AND deleted_at IS NULL;

-- Mixed / All-friendly post: clear taxonomy so it only matches All via linked products
UPDATE public.posts
SET
  category_id = NULL,
  range_id = NULL,
  department_id = NULL
WHERE id = 'eeee0001-24a8-4f00-8000-000000000005'
  AND deleted_at IS NULL;
