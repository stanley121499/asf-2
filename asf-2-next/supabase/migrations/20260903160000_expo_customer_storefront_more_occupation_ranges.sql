-- =============================================================================
-- Expo Customer Storefront — Additional occupation ranges (Coming soon)
-- =============================================================================
-- Seeds ≥3 extra occupations with shoes/bags/accessories categories but NO
-- product assignments, so Shop's existing Coming soon UI shows for every combo.
-- Idempotent: fixed UUIDs + ON CONFLICT DO UPDATE / deleted_at guards.
-- Dual-path mirror: asf-2-next/supabase/migrations/ (same filename).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Occupation ranges (a4200001-* continuing from Nurse/Electrician/Chef)
-- ---------------------------------------------------------------------------
-- Doctor / Teacher / Security / Waiter — zh on name; department_id NULL.
-- Media reused from existing curated taxonomy assets.
INSERT INTO public.ranges (id, name, active, media_url, department_id, created_at) VALUES
  (
    'a4200001-24a8-4f00-8000-000000000004',
    '医生',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000005.webp',
    NULL,
    NOW()
  ),
  (
    'a4200001-24a8-4f00-8000-000000000005',
    '教师',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000002.webp',
    NULL,
    NOW()
  ),
  (
    'a4200001-24a8-4f00-8000-000000000006',
    '保安',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000004.webp',
    NULL,
    NOW()
  ),
  (
    'a4200001-24a8-4f00-8000-000000000007',
    '服务员',
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
  ('a4200001-24a8-4f00-8000-000000000004', 'en', 'Doctor'),
  ('a4200001-24a8-4f00-8000-000000000004', 'ms', 'Doktor'),
  ('a4200001-24a8-4f00-8000-000000000005', 'en', 'Teacher'),
  ('a4200001-24a8-4f00-8000-000000000005', 'ms', 'Guru'),
  ('a4200001-24a8-4f00-8000-000000000006', 'en', 'Security'),
  ('a4200001-24a8-4f00-8000-000000000006', 'ms', 'Pengawal keselamatan'),
  ('a4200001-24a8-4f00-8000-000000000007', 'en', 'Waiter'),
  ('a4200001-24a8-4f00-8000-000000000007', 'ms', 'Pelayan')
ON CONFLICT (range_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 2) Categories: each new occupation × kind_key (a4300001-* from …0010)
-- ---------------------------------------------------------------------------
-- Arrangement: 1 shoes, 2 bags, 3 accessories.
-- Intentionally NO product remaps — all combos stay product_count = 0 (Coming soon).
-- Media reused from same kind_key on existing occupation categories.
INSERT INTO public.categories (
  id, name, active, media_url, arrangement, range_id, kind_key, created_at
) VALUES
  -- Doctor
  (
    'a4300001-24a8-4f00-8000-000000000010',
    '鞋履',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000001.webp',
    1,
    'a4200001-24a8-4f00-8000-000000000004',
    'shoes',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000011',
    '包袋',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000009.webp',
    2,
    'a4200001-24a8-4f00-8000-000000000004',
    'bags',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000012',
    '配件',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000010.webp',
    3,
    'a4200001-24a8-4f00-8000-000000000004',
    'accessories',
    NOW()
  ),
  -- Teacher
  (
    'a4300001-24a8-4f00-8000-000000000013',
    '鞋履',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000002.webp',
    1,
    'a4200001-24a8-4f00-8000-000000000005',
    'shoes',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000014',
    '包袋',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000009.webp',
    2,
    'a4200001-24a8-4f00-8000-000000000005',
    'bags',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000015',
    '配件',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000012.webp',
    3,
    'a4200001-24a8-4f00-8000-000000000005',
    'accessories',
    NOW()
  ),
  -- Security
  (
    'a4300001-24a8-4f00-8000-000000000016',
    '鞋履',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000004.webp',
    1,
    'a4200001-24a8-4f00-8000-000000000006',
    'shoes',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000017',
    '包袋',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000009.webp',
    2,
    'a4200001-24a8-4f00-8000-000000000006',
    'bags',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000018',
    '配件',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000012.webp',
    3,
    'a4200001-24a8-4f00-8000-000000000006',
    'accessories',
    NOW()
  ),
  -- Waiter
  (
    'a4300001-24a8-4f00-8000-000000000019',
    '鞋履',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000006.webp',
    1,
    'a4200001-24a8-4f00-8000-000000000007',
    'shoes',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000020',
    '包袋',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000009.webp',
    2,
    'a4200001-24a8-4f00-8000-000000000007',
    'bags',
    NOW()
  ),
  (
    'a4300001-24a8-4f00-8000-000000000021',
    '配件',
    true,
    'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-08/taxonomy/a3300001-24a8-4f00-8000-000000000010.webp',
    3,
    'a4200001-24a8-4f00-8000-000000000007',
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
  -- Doctor
  ('a4300001-24a8-4f00-8000-000000000010', 'en', 'Shoes'),
  ('a4300001-24a8-4f00-8000-000000000010', 'ms', 'Kasut'),
  ('a4300001-24a8-4f00-8000-000000000011', 'en', 'Bags'),
  ('a4300001-24a8-4f00-8000-000000000011', 'ms', 'Beg'),
  ('a4300001-24a8-4f00-8000-000000000012', 'en', 'Accessories'),
  ('a4300001-24a8-4f00-8000-000000000012', 'ms', 'Aksesori'),
  -- Teacher
  ('a4300001-24a8-4f00-8000-000000000013', 'en', 'Shoes'),
  ('a4300001-24a8-4f00-8000-000000000013', 'ms', 'Kasut'),
  ('a4300001-24a8-4f00-8000-000000000014', 'en', 'Bags'),
  ('a4300001-24a8-4f00-8000-000000000014', 'ms', 'Beg'),
  ('a4300001-24a8-4f00-8000-000000000015', 'en', 'Accessories'),
  ('a4300001-24a8-4f00-8000-000000000015', 'ms', 'Aksesori'),
  -- Security
  ('a4300001-24a8-4f00-8000-000000000016', 'en', 'Shoes'),
  ('a4300001-24a8-4f00-8000-000000000016', 'ms', 'Kasut'),
  ('a4300001-24a8-4f00-8000-000000000017', 'en', 'Bags'),
  ('a4300001-24a8-4f00-8000-000000000017', 'ms', 'Beg'),
  ('a4300001-24a8-4f00-8000-000000000018', 'en', 'Accessories'),
  ('a4300001-24a8-4f00-8000-000000000018', 'ms', 'Aksesori'),
  -- Waiter
  ('a4300001-24a8-4f00-8000-000000000019', 'en', 'Shoes'),
  ('a4300001-24a8-4f00-8000-000000000019', 'ms', 'Kasut'),
  ('a4300001-24a8-4f00-8000-000000000020', 'en', 'Bags'),
  ('a4300001-24a8-4f00-8000-000000000020', 'ms', 'Beg'),
  ('a4300001-24a8-4f00-8000-000000000021', 'en', 'Accessories'),
  ('a4300001-24a8-4f00-8000-000000000021', 'ms', 'Aksesori')
ON CONFLICT (category_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- Guard: ensure no products were accidentally linked to these Coming-soon categories
-- (idempotent no-op if already clean). Does not touch Nurse/Electrician/Chef products.
DELETE FROM public.product_categories
WHERE category_id IN (
  'a4300001-24a8-4f00-8000-000000000010',
  'a4300001-24a8-4f00-8000-000000000011',
  'a4300001-24a8-4f00-8000-000000000012',
  'a4300001-24a8-4f00-8000-000000000013',
  'a4300001-24a8-4f00-8000-000000000014',
  'a4300001-24a8-4f00-8000-000000000015',
  'a4300001-24a8-4f00-8000-000000000016',
  'a4300001-24a8-4f00-8000-000000000017',
  'a4300001-24a8-4f00-8000-000000000018',
  'a4300001-24a8-4f00-8000-000000000019',
  'a4300001-24a8-4f00-8000-000000000020',
  'a4300001-24a8-4f00-8000-000000000021'
);

UPDATE public.products
SET
  category_id = CASE
    WHEN category_id IN (
      'a4300001-24a8-4f00-8000-000000000010',
      'a4300001-24a8-4f00-8000-000000000011',
      'a4300001-24a8-4f00-8000-000000000012',
      'a4300001-24a8-4f00-8000-000000000013',
      'a4300001-24a8-4f00-8000-000000000014',
      'a4300001-24a8-4f00-8000-000000000015',
      'a4300001-24a8-4f00-8000-000000000016',
      'a4300001-24a8-4f00-8000-000000000017',
      'a4300001-24a8-4f00-8000-000000000018',
      'a4300001-24a8-4f00-8000-000000000019',
      'a4300001-24a8-4f00-8000-000000000020',
      'a4300001-24a8-4f00-8000-000000000021'
    ) THEN NULL
    ELSE category_id
  END,
  range_id = CASE
    WHEN range_id IN (
      'a4200001-24a8-4f00-8000-000000000004',
      'a4200001-24a8-4f00-8000-000000000005',
      'a4200001-24a8-4f00-8000-000000000006',
      'a4200001-24a8-4f00-8000-000000000007'
    ) THEN NULL
    ELSE range_id
  END
WHERE deleted_at IS NULL
  AND (
    category_id IN (
      'a4300001-24a8-4f00-8000-000000000010',
      'a4300001-24a8-4f00-8000-000000000011',
      'a4300001-24a8-4f00-8000-000000000012',
      'a4300001-24a8-4f00-8000-000000000013',
      'a4300001-24a8-4f00-8000-000000000014',
      'a4300001-24a8-4f00-8000-000000000015',
      'a4300001-24a8-4f00-8000-000000000016',
      'a4300001-24a8-4f00-8000-000000000017',
      'a4300001-24a8-4f00-8000-000000000018',
      'a4300001-24a8-4f00-8000-000000000019',
      'a4300001-24a8-4f00-8000-000000000020',
      'a4300001-24a8-4f00-8000-000000000021'
    )
    OR range_id IN (
      'a4200001-24a8-4f00-8000-000000000004',
      'a4200001-24a8-4f00-8000-000000000005',
      'a4200001-24a8-4f00-8000-000000000006',
      'a4200001-24a8-4f00-8000-000000000007'
    )
  );
