-- ==============================================================================
-- ASF Mini-Market: Clear Old Data (Keep New Mock Data)
-- Run this in Supabase SQL Editor AFTER you have tested the new mock data.
-- This will delete all your old products, posts, and categories, 
-- but will KEEP the new 20 Malaysian items, 6 posts, and 4 categories.
-- ==========================================

-- 1. DELETE OLD PRODUCT RELATIONS (Must do this before deleting products)
DELETE FROM product_categories WHERE product_id::text NOT LIKE 'bbbbbbbb-%';
DELETE FROM product_medias WHERE product_id::text NOT LIKE 'bbbbbbbb-%';
DELETE FROM product_stock WHERE product_id::text NOT LIKE 'bbbbbbbb-%';
DELETE FROM product_colors WHERE product_id::text NOT LIKE 'bbbbbbbb-%';
DELETE FROM product_sizes WHERE product_id::text NOT LIKE 'bbbbbbbb-%';

-- 2. DELETE OLD PRODUCTS
-- (The new mock products start with 'bbbbbbbb-')
DELETE FROM products WHERE id::text NOT LIKE 'bbbbbbbb-%';

-- 3. DELETE OLD POST RELATIONS
DELETE FROM post_medias WHERE post_id::text NOT LIKE 'cccccccc-%';

-- 4. DELETE OLD POSTS
-- (The new mock posts start with 'cccccccc-')
DELETE FROM posts WHERE id::text NOT LIKE 'cccccccc-%';

-- 5. DELETE OLD CATEGORIES
-- (The new mock categories start with 'aaaaaaaa-')
DELETE FROM categories WHERE id::text NOT LIKE 'aaaaaaaa-%';

-- Done! Your database is now perfectly clean with only the Mini-Market items.
