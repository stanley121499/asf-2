UPDATE public.post_medias pm SET media_url = v.media_url
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
WHERE pm.post_id = v.post_id::uuid AND pm.arrangement = 1;
