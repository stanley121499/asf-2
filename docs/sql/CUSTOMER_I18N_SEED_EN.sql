-- Customer App i18n — English seed data (locale = 'en')
--
-- Prerequisites: Run CUSTOMER_I18N_TRANSLATION_TABLES.sql first.
-- Entity UUIDs match the live ASF-2 catalog (gswszoljvafugtdikimn).
-- MODEL MATCH footwear/lifestyle overlay updated 2026-07-17.
-- Safe to re-run: uses ON CONFLICT ... DO UPDATE.

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT INTO category_translations (category_id, locale, name) VALUES
  ('aaaaaaaa-1111-1111-1111-000000000001', 'en', 'Sneakers'),
  ('aaaaaaaa-1111-1111-1111-000000000002', 'en', 'Formal & Boots'),
  ('aaaaaaaa-1111-1111-1111-000000000003', 'en', 'Accessories'),
  ('aaaaaaaa-1111-1111-1111-000000000004', 'en', 'Shoe Care')
ON CONFLICT (category_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Brands
-- ---------------------------------------------------------------------------
INSERT INTO brand_translations (brand_id, locale, name) VALUES
  ('0386eb77-408a-4ddd-a635-39d1d45b5449', 'en', 'Adidas'),
  ('16338fd0-4b05-4de7-a1e1-6b9cf5c04d05', 'en', 'Traditional Herbs Co.'),
  ('65c3aa90-f9c2-4aae-ae82-f85d9eb11b2b', 'en', 'Ancient Formula Herbs'),
  ('8d6feba0-be45-4c83-a7e0-b0d79c82319c', 'en', 'Valley Herbals'),
  ('dda49847-45f4-4490-a771-f2128a95db55', 'en', 'Pure Herbal Health'),
  ('d4242977-3d6e-4fc3-b099-095c2843030c', 'en', 'Greenland Botanicals'),
  ('f877052b-8587-47cc-b517-fcf66668531a', 'en', 'Nature''s Pharmacy')
ON CONFLICT (brand_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Departments
-- ---------------------------------------------------------------------------
INSERT INTO department_translations (department_id, locale, name) VALUES
  ('300f2f5b-3b64-4cd0-9601-73298e66af6b', 'en', 'Men'),
  ('e7b437c5-2571-4978-b113-f5b3c5c38e60', 'en', 'Women'),
  ('4e81c815-a81c-4b3b-aa6e-a274dd5537ff', 'en', 'Health & Prevention'),
  ('dc30f462-f90c-4880-8cc7-dd666b8ef20d', 'en', 'Therapeutic Herbs'),
  ('a1508ede-1ab9-4de5-877d-4a852b7d6524', 'en', 'Men''s'),
  ('d5a053cc-cc9b-449e-9ca4-a53d5e3f52bf', 'en', 'Herbal Medicine')
ON CONFLICT (department_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Ranges
-- ---------------------------------------------------------------------------
INSERT INTO range_translations (range_id, locale, name) VALUES
  ('4e957bf0-ed6c-4e95-b59d-d174fd675b57', 'en', 'Athleisure'),
  ('3fe8ba33-d59f-41fc-9b73-f5c0ec7f84d4', 'en', 'Cotton'),
  ('6695d0a7-50b5-499f-b3cd-fc34d2cb6163', 'en', 'Leather'),
  ('e1d78198-d4d2-4591-ac3e-194f8ab23925', 'en', 'Performance'),
  ('b6d0395c-d0a8-4623-b243-a1e1749fea83', 'en', 'Track'),
  ('6298ea66-4bc7-4d93-a014-b87f9f661e39', 'en', 'Immune Support'),
  ('46105533-a728-469f-97f4-6a38ab4ce631', 'en', 'Stress & Sleep'),
  ('cbf134d2-d139-4717-a4d8-870ea873f4ba', 'en', 'Digestive Health'),
  ('054d9d06-41b3-4a83-8b06-7ff7ca3f189c', 'en', 'Pain Relief'),
  ('ab898881-2dd3-4ed5-bf88-f28ed4f75419', 'en', 'Energy & Vitality'),
  ('1693a619-72df-4cc7-b28e-944d810ea213', 'en', 'Cognitive Support')
ON CONFLICT (range_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
INSERT INTO post_translations (post_id, locale, name, caption, cta_text) VALUES
  ('cccccccc-1111-1111-1111-000000000001', 'en', 'New Season Court Classics', 'The new court collection is here. Clean whites and sharp lines — turn every day into home court.', 'Shop now'),
  ('cccccccc-1111-1111-1111-000000000002', 'en', 'Night City High-Tops', 'When the city lights up, high-tops stand taller. Walk the glow with MODEL MATCH.', 'Explore'),
  ('cccccccc-1111-1111-1111-000000000003', 'en', 'Chelsea Boot Editorial', 'Elastic sides, clean silhouette — one Chelsea boot takes you from meetings to weekends.', 'View boots'),
  ('cccccccc-1111-1111-1111-000000000004', 'en', 'Trail Weekend', 'Grip mid-cuts and breathable layers — turn weekend trails into a light hiking ritual.', 'Get ready'),
  ('cccccccc-1111-1111-1111-000000000005', 'en', 'Accessories Finish the Look', 'Belts, crossbodies, and caps — small pieces that complete the attitude.', 'Shop accessories'),
  ('cccccccc-1111-1111-1111-000000000006', 'en', 'Care Ritual', 'Brush, cream, and shoe trees — keep your favorite kicks ready for the next season.', 'Learn care')
ON CONFLICT (post_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  caption = EXCLUDED.caption,
  cta_text = EXCLUDED.cta_text,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Products (20 live demo products)
-- ---------------------------------------------------------------------------
INSERT INTO product_translations (product_id, locale, name, description) VALUES
  ('bbbbbbbb-1111-1111-1111-000000000001', 'en', 'Classic Court Sneaker', 'Clean lines and a breathable upper — the everyday court classic.'),
  ('bbbbbbbb-1111-1111-1111-000000000002', 'en', 'Urban Runner', 'Light cushioning for city commutes and easy pace days.'),
  ('bbbbbbbb-1111-1111-1111-000000000003', 'en', 'Night Street High-Top', 'Dark high-top profile with presence after sundown.'),
  ('bbbbbbbb-1111-1111-1111-000000000004', 'en', 'Minimal Leather Derby', 'Sharp derby cut for office hours and evening plans.'),
  ('bbbbbbbb-1111-1111-1111-000000000005', 'en', 'Black Chelsea Boot', 'Elastic-side Chelsea boots — slip on a clean silhouette.'),
  ('bbbbbbbb-1111-1111-1111-000000000006', 'en', 'Trail Hiker Mid', 'Grippy mid-cut for weekend trails and light hikes.'),
  ('bbbbbbbb-1111-1111-1111-000000000007', 'en', 'Soft Knit Slip-On', 'Sock-like fit for effortless everyday steps.'),
  ('bbbbbbbb-1111-1111-1111-000000000008', 'en', 'Retro Court Low', 'Retro colorways on a low court silhouette.'),
  ('bbbbbbbb-1111-1111-1111-000000000009', 'en', 'Platform Sandal', 'Light platform sandal for summer proportions.'),
  ('bbbbbbbb-1111-1111-1111-000000000010', 'en', 'Penny Loafer', 'Classic penny loafer — smart casual, anytime.'),
  ('bbbbbbbb-1111-1111-1111-000000000011', 'en', 'Chunky Dad Sneaker', 'Bold sole and retro shape for stacked street looks.'),
  ('bbbbbbbb-1111-1111-1111-000000000012', 'en', 'Performance Trainer', 'Multi-directional support for gym and daily wear.'),
  ('bbbbbbbb-1111-1111-1111-000000000013', 'en', 'Suede Ankle Boot', 'Soft suede texture for layered autumn outfits.'),
  ('bbbbbbbb-1111-1111-1111-000000000014', 'en', 'Canvas Low Classic', 'Light canvas low-tops that never go out of style.'),
  ('bbbbbbbb-1111-1111-1111-000000000015', 'en', 'Sock Runner', 'Integrated sock collar for a closer, lighter run.'),
  ('bbbbbbbb-1111-1111-1111-000000000016', 'en', 'Leather Belt', 'Simple leather belt to finish the whole look.'),
  ('bbbbbbbb-1111-1111-1111-000000000017', 'en', 'Crew Socks 3-Pack', 'Comfortable crew socks in a ready-to-rotate pack.'),
  ('bbbbbbbb-1111-1111-1111-000000000018', 'en', 'Shoe Care Kit', 'Clean, condition, and polish — extend your footwear life.'),
  ('bbbbbbbb-1111-1111-1111-000000000019', 'en', 'Mini Crossbody', 'Light crossbody that frees your hands and finishes the outfit.'),
  ('bbbbbbbb-1111-1111-1111-000000000020', 'en', 'Logo Cap', 'Classic baseball silhouette with MODEL MATCH attitude.')
ON CONFLICT (product_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
