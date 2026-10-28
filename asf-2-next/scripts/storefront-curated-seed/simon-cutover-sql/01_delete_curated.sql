-- Simon cutover: remove curated mock catalog (safe: no order_items on dddd*)
-- KEPT: soft-deleted bbbb* legacy demo products (order history), auth, orders

-- Clear carts pointing at curated products
DELETE FROM public.add_to_carts WHERE product_id::text LIKE 'dddd%';

-- Junctions
DELETE FROM public.post_products WHERE product_id::text LIKE 'dddd%' OR post_id::text LIKE 'eeee%';
DELETE FROM public.promotion_products WHERE product_id::text LIKE 'dddd%' OR promotion_id::text LIKE '4444%' OR promotion_id::text LIKE '3333%';

-- Medias
DELETE FROM public.product_medias WHERE product_id::text LIKE 'dddd%' OR id::text LIKE 'a360%';
DELETE FROM public.post_medias WHERE post_id::text LIKE 'eeee%';

-- Colors / stock / categories / translations
DELETE FROM public.product_colors WHERE product_id::text LIKE 'dddd%' OR id::text LIKE 'a350%';
DELETE FROM public.product_stock WHERE product_id::text LIKE 'dddd%';
DELETE FROM public.product_categories WHERE product_id::text LIKE 'dddd%';
DELETE FROM public.product_translations WHERE product_id::text LIKE 'dddd%';
DELETE FROM public.post_translations WHERE post_id::text LIKE 'eeee%';

-- Soft-delete any remaining sales/events on curated if present (keep rows if FK blocks)
DELETE FROM public.product_events WHERE product_id::text LIKE 'dddd%';

-- Core entities
DELETE FROM public.products WHERE id::text LIKE 'dddd%';
UPDATE public.posts SET active = false, status = 'Archived', deleted_at = NOW()
WHERE id::text LIKE 'eeee%' AND deleted_at IS NULL;
DELETE FROM public.posts WHERE id::text LIKE 'eeee%'
  AND NOT EXISTS (SELECT 1 FROM public.post_medias pm WHERE pm.post_id = posts.id)
  AND NOT EXISTS (SELECT 1 FROM public.post_products pp WHERE pp.post_id = posts.id);

-- Hard-delete curated posts after children cleared
DELETE FROM public.post_medias WHERE post_id::text LIKE 'eeee%';
DELETE FROM public.post_products WHERE post_id::text LIKE 'eeee%';
DELETE FROM public.post_translations WHERE post_id::text LIKE 'eeee%';
DELETE FROM public.posts WHERE id::text LIKE 'eeee%';

UPDATE public.promotions SET active = false, status = 'DRAFT', deleted_at = NOW()
WHERE (id::text LIKE '4444%' OR id::text LIKE '3333%') AND deleted_at IS NULL;
DELETE FROM public.promotion_products WHERE promotion_id::text LIKE '4444%' OR promotion_id::text LIKE '3333%';
DELETE FROM public.promotions WHERE id::text LIKE '4444%' OR id::text LIKE '3333%';

-- Soft-delete old footwear taxonomy tiles that only served the mock catalog
UPDATE public.categories
SET active = false, deleted_at = COALESCE(deleted_at, NOW())
WHERE id::text LIKE 'a330%' AND deleted_at IS NULL;

UPDATE public.ranges
SET active = false, deleted_at = COALESCE(deleted_at, NOW())
WHERE id::text LIKE 'a320%' AND deleted_at IS NULL;
