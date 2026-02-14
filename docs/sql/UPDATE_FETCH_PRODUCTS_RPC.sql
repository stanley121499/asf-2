-- ============================================
-- UPDATE RPC: fetch_products_with_computed_attributes (PASTE INTO SUPABASE SQL EDITOR)
-- ============================================
-- Purpose:
-- - Exclude soft-deleted products (`products.deleted_at IS NULL`) so the app never
--   receives deleted products from this RPC.
-- - Also exclude soft-deleted variants/categories from the aggregated JSON payloads.
--
-- Notes:
-- - Keeps existing behavior for `active` filtering (colors/sizes already filter active=true).
-- - Does NOT change the return type/signature.

CREATE OR REPLACE FUNCTION public.fetch_products_with_computed_attributes()
 RETURNS TABLE(
  id uuid,
  article_number text,
  created_at timestamp with time zone,
  description text,
  festival text,
  name text,
  price real,
  product_folder_id uuid,
  season text,
  status text,
  stock_code text,
  stock_place text,
  time_post text,
  updated_at timestamp with time zone,
  stock_count bigint,
  stock_status text,
  product_colors jsonb,
  product_sizes jsonb,
  product_categories jsonb
 )
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.article_number,
        p.created_at,
        p.description,
        p.festival,
        p.name,
        p.price,
        p.product_folder_id,
        p.season,
        p.status,
        p.stock_code,
        p.stock_place,
        p.time_post::TEXT, -- Cast to TEXT to match schema
        p.updated_at,
        COALESCE(ps.stock_count, 0) AS stock_count,
        CASE
            WHEN COALESCE(ps.stock_count, 0) < 100 THEN 'low'
            WHEN MAX(psl.created_at) < NOW() - INTERVAL '1 month' THEN 'hold'
            ELSE 'normal'
        END AS stock_status,
        (
            SELECT jsonb_agg(to_jsonb(pc.*))
            FROM product_colors pc
            WHERE
              pc.product_id = p.id
              AND pc.active = true
              AND pc.deleted_at IS NULL
        ) AS product_colors,
        (
            SELECT jsonb_agg(to_jsonb(psz.*))
            FROM product_sizes psz
            WHERE
              psz.product_id = p.id
              AND psz.active = true
              AND psz.deleted_at IS NULL
        ) AS product_sizes,
        (
            SELECT jsonb_agg(to_jsonb(c.*))
            FROM product_categories pc
            JOIN categories c ON pc.category_id = c.id
            WHERE
              pc.product_id = p.id
              AND c.deleted_at IS NULL
        ) AS product_categories
    FROM
        products p
    LEFT JOIN (
        SELECT
            ps.product_id,
            SUM(ps.count) AS stock_count
        FROM
            product_stock ps
        GROUP BY
            ps.product_id
    ) ps ON p.id = ps.product_id
    LEFT JOIN (
        SELECT
            psl.product_stock_id,
            MAX(psl.created_at) AS created_at
        FROM
            product_stock_logs psl
        GROUP BY
            psl.product_stock_id
    ) psl ON ps.product_id = psl.product_stock_id
    WHERE
      p.deleted_at IS NULL
    GROUP BY
        p.id,
        p.article_number,
        p.created_at,
        p.description,
        p.festival,
        p.name,
        p.price,
        p.product_folder_id,
        p.season,
        p.status,
        p.stock_code,
        p.stock_place,
        p.time_post,
        p.updated_at,
        ps.stock_count;
END;
$function$;



