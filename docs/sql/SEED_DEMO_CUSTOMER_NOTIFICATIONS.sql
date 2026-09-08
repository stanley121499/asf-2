-- =============================================================================
-- Demo / staging: seed customer inbox notifications (Agent 1 strategy)
-- =============================================================================
-- Purpose: Fill the Expo notifications inbox so demos are not empty.
-- Safe by default: targets ONE explicit user id, OR users who already have
-- push_tokens / wishlist rows (never all auth.users).
--
-- HOW STANLEY APPLIES
-- -------------------
-- 1) Prefer a known demo account. Replace the UUID below with that auth.users id:
--
--      SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 20;
--
-- 2) Run this file in Supabase SQL Editor (or MCP execute_sql / psql).
-- 3) Mode A (recommended): set demo_user_id to a real UUID and leave
--    seed_from_engagement = false.
-- 4) Mode B: set seed_from_engagement = true and demo_user_id = NULL to seed
--    every distinct user_id present in push_tokens OR wishlist (still bounded).
-- 5) Re-run safe for the same demo marker metadata (deletes prior demo rows
--    tagged metadata->>'demo_seed' = 'expo_engagement_2026-09-08' for targets).
--
-- Prerequisites: Agent 1 migration applied (nearby templates optional for inbox;
--   this seed uses plaintext title/body so templates are not required).
-- Product deep_links use curated seed product UUID when present.
-- =============================================================================

DO $$
DECLARE
  -- Mode A: set to a real auth.users.id (recommended for demos).
  demo_user_id UUID := NULL; -- e.g. 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::uuid;

  -- Mode B: when true AND demo_user_id IS NULL, seed users with push_tokens/wishlist.
  seed_from_engagement BOOLEAN := TRUE;

  demo_marker TEXT := 'expo_engagement_2026-09-08';
  sample_product_id UUID;
  sample_store_id UUID;
  sample_mall_name TEXT;
  sample_store_name TEXT;
  target_user UUID;
  inserted_count INTEGER := 0;
BEGIN
  -- Prefer a known curated catalog product; fall back to any live product.
  SELECT p.id
  INTO sample_product_id
  FROM public.products p
  WHERE p.id = 'dddd0101-24a8-4f00-8000-000000000001'::uuid
    AND p.deleted_at IS NULL
  LIMIT 1;

  IF sample_product_id IS NULL THEN
    SELECT p.id
    INTO sample_product_id
    FROM public.products p
    WHERE p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT 1;
  END IF;

  SELECT sl.id, sl.mall_name, sl.name
  INTO sample_store_id, sample_mall_name, sample_store_name
  FROM public.store_locations sl
  WHERE sl.deleted_at IS NULL
    AND sl.active = TRUE
  ORDER BY sl.sort_order
  LIMIT 1;

  IF sample_product_id IS NULL THEN
    RAISE NOTICE 'SEED_DEMO_CUSTOMER_NOTIFICATIONS: no products found; aborting.';
    RETURN;
  END IF;

  IF demo_user_id IS NULL AND seed_from_engagement IS NOT TRUE THEN
    RAISE NOTICE
      'SEED_DEMO_CUSTOMER_NOTIFICATIONS: set demo_user_id or seed_from_engagement = true; aborting.';
    RETURN;
  END IF;

  -- Remove previous demo rows for the same marker on target users only.
  IF demo_user_id IS NOT NULL THEN
    DELETE FROM public.notifications n
    WHERE n.user_id = demo_user_id
      AND n.metadata->>'demo_seed' = demo_marker;
  ELSIF seed_from_engagement THEN
    DELETE FROM public.notifications n
    WHERE n.metadata->>'demo_seed' = demo_marker
      AND (
        EXISTS (SELECT 1 FROM public.push_tokens pt WHERE pt.user_id = n.user_id)
        OR EXISTS (SELECT 1 FROM public.wishlist w WHERE w.user_id = n.user_id)
      );
  END IF;

  FOR target_user IN
    SELECT DISTINCT u.user_id
    FROM (
      SELECT demo_user_id AS user_id
      WHERE demo_user_id IS NOT NULL
      UNION ALL
      SELECT pt.user_id
      FROM public.push_tokens pt
      WHERE demo_user_id IS NULL
        AND seed_from_engagement IS TRUE
      UNION ALL
      SELECT w.user_id
      FROM public.wishlist w
      WHERE demo_user_id IS NULL
        AND seed_from_engagement IS TRUE
    ) u
    WHERE u.user_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, metadata, created_at)
    VALUES
      (
        target_user,
        'order_confirmed',
        'Order confirmed',
        'Your order #DEMO-1001 has been confirmed. We will keep you updated.',
        jsonb_build_object(
          'demo_seed', demo_marker,
          'deep_link', 'order:demo-1001',
          'order_label', '#DEMO-1001'
        ),
        NOW() - INTERVAL '5 days'
      ),
      (
        target_user,
        'promotion',
        'Weekend member offer',
        'Enjoy an extra treat on selected Model Match styles this weekend.',
        jsonb_build_object(
          'demo_seed', demo_marker,
          'deep_link', format('product:%s', sample_product_id::text),
          'product_id', sample_product_id
        ),
        NOW() - INTERVAL '3 days'
      ),
      (
        target_user,
        'wishlist_nearby_stock',
        'In stock nearby',
        format(
          'A wishlist item is available at %s (%s).',
          COALESCE(sample_mall_name, 'your nearby mall'),
          COALESCE(sample_store_name, 'Model Match')
        ),
        jsonb_build_object(
          'demo_seed', demo_marker,
          'deep_link', format('product:%s', sample_product_id::text),
          'product_id', sample_product_id,
          'store_location_id', sample_store_id
        ),
        NOW() - INTERVAL '1 day'
      ),
      (
        target_user,
        'claim_status_changed',
        'Claim status updated',
        'Claim #DEMO-CLM-01 is now Under review.',
        jsonb_build_object(
          'demo_seed', demo_marker,
          'deep_link', 'claim:demo-clm-01',
          'claim_label', '#DEMO-CLM-01',
          'status_label', 'Under review'
        ),
        NOW() - INTERVAL '12 hours'
      ),
      (
        target_user,
        'ticket_replied',
        'New reply on your ticket',
        'There is a new reply on support ticket #DEMO-TCK-01.',
        jsonb_build_object(
          'demo_seed', demo_marker,
          'deep_link', 'ticket:demo-tck-01',
          'ticket_label', '#DEMO-TCK-01'
        ),
        NOW() - INTERVAL '2 hours'
      ),
      (
        target_user,
        'warranty_registration_activated',
        'Warranty activated',
        'Warranty registration #DEMO-WR-01 is active.',
        jsonb_build_object(
          'demo_seed', demo_marker,
          'deep_link', 'registration:demo-wr-01',
          'registration_label', '#DEMO-WR-01'
        ),
        NOW() - INTERVAL '30 minutes'
      );

    inserted_count := inserted_count + 6;
  END LOOP;

  RAISE NOTICE
    'SEED_DEMO_CUSTOMER_NOTIFICATIONS: inserted % notification row(s). product=% store=%',
    inserted_count,
    sample_product_id,
    sample_store_id;
END $$;
