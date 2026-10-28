INSERT INTO public.post_medias (post_id, media_url, media_type, arrangement, created_at)
SELECT v.post_id, v.media_url, 'image', 1, NOW()
FROM (VALUES
  ('c2010001-24a8-4f00-8000-000000000001'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000001.webp'),
  ('c2010001-24a8-4f00-8000-000000000002'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000002.webp'),
  ('c2010001-24a8-4f00-8000-000000000003'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000003.webp'),
  ('c2010001-24a8-4f00-8000-000000000004'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000004.webp'),
  ('c2010001-24a8-4f00-8000-000000000005'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000005.webp'),
  ('c2010001-24a8-4f00-8000-000000000006'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000006.webp'),
  ('c2010001-24a8-4f00-8000-000000000007'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000007.webp'),
  ('c2010001-24a8-4f00-8000-000000000008'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000008.webp'),
  ('c2010001-24a8-4f00-8000-000000000009'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000009.webp'),
  ('c2010001-24a8-4f00-8000-000000000010'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000010.webp')
) AS v(post_id, media_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.post_medias pm
  WHERE pm.post_id = v.post_id AND pm.arrangement = 1
);
