-- Customer App i18n — English seed data (locale = 'en')
--
-- Prerequisites: Run CUSTOMER_I18N_TRANSLATION_TABLES.sql first.
-- Entity UUIDs match the live ASF-2 catalog (gswszoljvafugtdikimn) as of 2026-07-08.
-- Safe to re-run: uses ON CONFLICT ... DO UPDATE.

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT INTO category_translations (category_id, locale, name) VALUES
  ('aaaaaaaa-1111-1111-1111-000000000001', 'en', 'Beverages'),
  ('aaaaaaaa-1111-1111-1111-000000000002', 'en', 'Snacks & Food'),
  ('aaaaaaaa-1111-1111-1111-000000000003', 'en', 'Personal Care'),
  ('aaaaaaaa-1111-1111-1111-000000000004', 'en', 'Household')
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
  ('cccccccc-1111-1111-1111-000000000001', 'en', 'Binge-Watch Essentials', 'The ultimate binge-watch pack! Favorite chocolate bars for every episode — extra sweetness guaranteed.', 'Shop now'),
  ('cccccccc-1111-1111-1111-000000000002', 'en', 'Summer Chill', 'Ice-cold lime mint soda piled with ice — one sip melts the heat.', 'Cool down'),
  ('cccccccc-1111-1111-1111-000000000003', 'en', 'Highland Tea Picks', 'Organic highland black tea with a rich aroma and lasting finish. The best afternoon treat for yourself.', 'Taste the tea'),
  ('cccccccc-1111-1111-1111-000000000004', 'en', 'Ramen Night Champion', 'Who can resist a steaming bowl of Korean spicy ramen? Bold broth, springy noodles — midnight snack MVP.', 'Stock up'),
  ('cccccccc-1111-1111-1111-000000000005', 'en', 'Deep Roast Coffee Beans', 'Start the morning by grinding a cup of deep-roast specialty beans. Fill the house with rich coffee aroma.', 'Shop coffee'),
  ('cccccccc-1111-1111-1111-000000000006', 'en', 'Cold Brew, Smooth Sip', 'House cold brew coffee — sugar-free, zero calorie, low acid and silky. Made for coffee lovers.', 'Take it home')
ON CONFLICT (post_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  caption = EXCLUDED.caption,
  cta_text = EXCLUDED.cta_text,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Products (20 live demo products)
-- ---------------------------------------------------------------------------
INSERT INTO product_translations (product_id, locale, name, description) VALUES
  ('bbbbbbbb-1111-1111-1111-000000000001', 'en', 'Coca-Cola Classic', 'Crisp, bold, timeless classic taste'),
  ('bbbbbbbb-1111-1111-1111-000000000002', 'en', 'Premium Roast Beans', 'Deep roast with a rich, lasting aroma'),
  ('bbbbbbbb-1111-1111-1111-000000000003', 'en', 'Highland Organic Black Tea', 'Organically grown with a sweet aftertaste'),
  ('bbbbbbbb-1111-1111-1111-000000000004', 'en', 'Cold Brew Coffee', 'Smooth and low-acid — summer refreshment'),
  ('bbbbbbbb-1111-1111-1111-000000000005', 'en', 'Lime Mint Soda', 'Fresh, crisp, and heat-beating'),
  ('bbbbbbbb-1111-1111-1111-000000000006', 'en', 'Artisan Latte', 'Silky foam blended with bold espresso'),
  ('bbbbbbbb-1111-1111-1111-000000000007', 'en', 'Korean Spicy Ramen', 'Chewy noodles in a rich, spicy broth'),
  ('bbbbbbbb-1111-1111-1111-000000000008', 'en', 'Assorted Chocolates', 'Includes Mars, KitKat, and other bestsellers'),
  ('bbbbbbbb-1111-1111-1111-000000000009', 'en', 'Butter Cookies', 'Rich butter aroma that melts in your mouth'),
  ('bbbbbbbb-1111-1111-1111-000000000010', 'en', 'Crispy Potato Chips', 'Crunchy chips — perfect binge-watch snack'),
  ('bbbbbbbb-1111-1111-1111-000000000011', 'en', 'Mixed Nuts', 'Healthy, delicious, fully nutritious'),
  ('bbbbbbbb-1111-1111-1111-000000000012', 'en', 'Baked Granola Bars', 'High fiber, low fat — a healthy meal swap'),
  ('bbbbbbbb-1111-1111-1111-000000000013', 'en', 'Popcorn Family Pack', 'Sweet caramel — cinema vibes at home'),
  ('bbbbbbbb-1111-1111-1111-000000000014', 'en', 'Nourishing Body Wash', 'Milk essence for soft, hydrated skin'),
  ('bbbbbbbb-1111-1111-1111-000000000015', 'en', 'Herbal Toothpaste', 'Gum care with fresh herbal mint'),
  ('bbbbbbbb-1111-1111-1111-000000000016', 'en', 'Essential Oil Shampoo', 'Improves hair quality and smooths frizz'),
  ('bbbbbbbb-1111-1111-1111-000000000017', 'en', 'Deep Clean Detergent', 'Powerful clean with 99.9% antibacterial action'),
  ('bbbbbbbb-1111-1111-1111-000000000018', 'en', 'Lemon Dishwash', 'One drop works — gentle on hands'),
  ('bbbbbbbb-1111-1111-1111-000000000019', 'en', 'Premium Tissue', '3-ply thick — stays strong when wet'),
  ('bbbbbbbb-1111-1111-1111-000000000020', 'en', 'Multi-Surface Cleaner', 'Works for kitchen and bathroom')
ON CONFLICT (product_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
