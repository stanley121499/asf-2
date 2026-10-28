-- Ensure Shop occupation path is active
UPDATE public.ranges SET active = true, deleted_at = NULL WHERE id = 'a4200001-24a8-4f00-8000-000000000001';
UPDATE public.categories SET active = true, deleted_at = NULL WHERE id = 'a4300001-24a8-4f00-8000-000000000001';
-- Shop 鞋履 tile: real Simon black knit Mary Jane Angle A hero (not old 跑鞋 mock)
UPDATE public.categories
SET media_url = 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000001/c1500101-24a8-4f00-8000-000000000001/sf-hero-34.webp?v=20261028shoetile'
WHERE id = 'a4300001-24a8-4f00-8000-000000000001';
UPDATE public.departments SET active = true, deleted_at = NULL WHERE id = 'a3100001-24a8-4f00-8000-000000000002';
UPDATE public.brand SET active = true, deleted_at = NULL WHERE id = 'a3400001-24a8-4f00-8000-000000000001';
