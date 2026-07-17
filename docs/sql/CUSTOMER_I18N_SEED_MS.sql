-- Customer App i18n — Malay seed data (locale = 'ms')
--
-- Prerequisites: Run CUSTOMER_I18N_TRANSLATION_TABLES.sql and CUSTOMER_I18N_MS_MIGRATION.sql first.
-- Entity UUIDs match the live ASF-2 catalog (gswszoljvafugtdikimn).
-- MODEL MATCH footwear/lifestyle overlay updated 2026-07-17.
-- Safe to re-run: uses ON CONFLICT ... DO UPDATE.

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT INTO category_translations (category_id, locale, name) VALUES
  ('aaaaaaaa-1111-1111-1111-000000000001', 'ms', 'Kasut sukan'),
  ('aaaaaaaa-1111-1111-1111-000000000002', 'ms', 'Kasut rasmi & but'),
  ('aaaaaaaa-1111-1111-1111-000000000003', 'ms', 'Aksesori'),
  ('aaaaaaaa-1111-1111-1111-000000000004', 'ms', 'Penjagaan kasut')
ON CONFLICT (category_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Brands
-- ---------------------------------------------------------------------------
INSERT INTO brand_translations (brand_id, locale, name) VALUES
  ('0386eb77-408a-4ddd-a635-39d1d45b5449', 'ms', 'Adidas'),
  ('16338fd0-4b05-4de7-a1e1-6b9cf5c04d05', 'ms', 'Herba Tradisional Co.'),
  ('65c3aa90-f9c2-4aae-ae82-f85d9eb11b2b', 'ms', 'Herba Formula Purba'),
  ('8d6feba0-be45-4c83-a7e0-b0d79c82319c', 'ms', 'Herba Lembah'),
  ('dda49847-45f4-4490-a771-f2128a95db55', 'ms', 'Kesihatan Herba Tulen'),
  ('d4242977-3d6e-4fc3-b099-095c2843030c', 'ms', 'Botani Greenland'),
  ('f877052b-8587-47cc-b517-fcf66668531a', 'ms', 'Farmasi Alam')
ON CONFLICT (brand_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Departments
-- ---------------------------------------------------------------------------
INSERT INTO department_translations (department_id, locale, name) VALUES
  ('300f2f5b-3b64-4cd0-9601-73298e66af6b', 'ms', 'Lelaki'),
  ('e7b437c5-2571-4978-b113-f5b3c5c38e60', 'ms', 'Wanita'),
  ('4e81c815-a81c-4b3b-aa6e-a274dd5537ff', 'ms', 'Kesihatan & Pencegahan'),
  ('dc30f462-f90c-4880-8cc7-dd666b8ef20d', 'ms', 'Herba Terapeutik'),
  ('a1508ede-1ab9-4de5-877d-4a852b7d6524', 'ms', 'Lelaki'),
  ('d5a053cc-cc9b-449e-9ca4-a53d5e3f52bf', 'ms', 'Ubat Herba')
ON CONFLICT (department_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Ranges
-- ---------------------------------------------------------------------------
INSERT INTO range_translations (range_id, locale, name) VALUES
  ('4e957bf0-ed6c-4e95-b59d-d174fd675b57', 'ms', 'Athleisure'),
  ('3fe8ba33-d59f-41fc-9b73-f5c0ec7f84d4', 'ms', 'Kapas'),
  ('6695d0a7-50b5-499f-b3cd-fc34d2cb6163', 'ms', 'Kulit'),
  ('e1d78198-d4d2-4591-ac3e-194f8ab23925', 'ms', 'Prestasi'),
  ('b6d0395c-d0a8-4623-b243-a1e1749fea83', 'ms', 'Trek'),
  ('6298ea66-4bc7-4d93-a014-b87f9f661e39', 'ms', 'Sokongan Imun'),
  ('46105533-a728-469f-97f4-6a38ab4ce631', 'ms', 'Stres & Tidur'),
  ('cbf134d2-d139-4717-a4d8-870ea873f4ba', 'ms', 'Kesihatan Pencernaan'),
  ('054d9d06-41b3-4a83-8b06-7ff7ca3f189c', 'ms', 'Melegakan Kesakitan'),
  ('ab898881-2dd3-4ed5-bf88-f28ed4f75419', 'ms', 'Tenaga & Vitaliti'),
  ('1693a619-72df-4cc7-b28e-944d810ea213', 'ms', 'Sokongan Kognitif')
ON CONFLICT (range_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
INSERT INTO post_translations (post_id, locale, name, caption, cta_text) VALUES
  ('cccccccc-1111-1111-1111-000000000001', 'ms', 'Klasik Gelanggang Musim Baru', 'Koleksi gelanggang baharu sudah tiba. Putih bersih dan garis tegas — jadikan setiap hari seperti gelanggang sendiri.', 'Beli sekarang'),
  ('cccccccc-1111-1111-1111-000000000002', 'ms', 'High-Top Malam Bandar', 'Apabila bandar menyala, high-top lebih menonjol. Berjalan dalam cahaya bersama MODEL MATCH.', 'Terokai'),
  ('cccccccc-1111-1111-1111-000000000003', 'ms', 'Editorial But Chelsea', 'Sisi elastik, siluet kemas — satu but Chelsea membawa anda dari mesyuarat ke hujung minggu.', 'Lihat but'),
  ('cccccccc-1111-1111-1111-000000000004', 'ms', 'Hujung Minggu Jejak', 'Potongan mid dengan cengkaman dan lapisan bernafas — jadikan jejak hujung minggu sebagai ritual hiking ringan.', 'Bersedia'),
  ('cccccccc-1111-1111-1111-000000000005', 'ms', 'Aksesori Melengkapkan Gaya', 'Tali pinggang, beg silang dan topi — butiran kecil yang melengkapkan sikap.', 'Beli aksesori'),
  ('cccccccc-1111-1111-1111-000000000006', 'ms', 'Ritual Penjagaan', 'Berus, krim dan shoe tree — jaga kasut kegemaran anda untuk musim akan datang.', 'Ketahui penjagaan')
ON CONFLICT (post_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  caption = EXCLUDED.caption,
  cta_text = EXCLUDED.cta_text,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Products (20 live demo products)
-- ---------------------------------------------------------------------------
INSERT INTO product_translations (product_id, locale, name, description) VALUES
  ('bbbbbbbb-1111-1111-1111-000000000001', 'ms', 'Kasut Gelanggang Klasik', 'Garisan bersih dan bahagian atas bernafas — klasik gelanggang untuk setiap hari.'),
  ('bbbbbbbb-1111-1111-1111-000000000002', 'ms', 'Pelari Bandar', 'Kusyen ringan untuk perjalanan bandar dan rentak santai.'),
  ('bbbbbbbb-1111-1111-1111-000000000003', 'ms', 'High-Top Jalan Malam', 'Profil high-top gelap yang lebih menonjol selepas matahari terbenam.'),
  ('bbbbbbbb-1111-1111-1111-000000000004', 'ms', 'Derby Kulit Minimal', 'Potongan derby kemas untuk pejabat dan rancangan malam.'),
  ('bbbbbbbb-1111-1111-1111-000000000005', 'ms', 'But Chelsea Hitam', 'But Chelsea dengan sisi elastik — siluet kemas, mudah dipakai.'),
  ('bbbbbbbb-1111-1111-1111-000000000006', 'ms', 'Hiker Jejak Mid', 'Potongan mid dengan cengkaman untuk jejak hujung minggu dan hiking ringan.'),
  ('bbbbbbbb-1111-1111-1111-000000000007', 'ms', 'Slip-On Knit Lembut', 'Muat seperti stokin untuk langkah harian tanpa susah payah.'),
  ('bbbbbbbb-1111-1111-1111-000000000008', 'ms', 'Court Low Retro', 'Warna retro pada siluet court rendah.'),
  ('bbbbbbbb-1111-1111-1111-000000000009', 'ms', 'Sandal Platform', 'Sandal platform ringan untuk proporsi musim panas.'),
  ('bbbbbbbb-1111-1111-1111-000000000010', 'ms', 'Loafer Penny', 'Loafer penny klasik — smart casual bila-bila masa.'),
  ('bbbbbbbb-1111-1111-1111-000000000011', 'ms', 'Sneaker Dad Tebal', 'Tapak tebal dan bentuk retro untuk gaya jalanan berlapis.'),
  ('bbbbbbbb-1111-1111-1111-000000000012', 'ms', 'Kasut Latihan Prestasi', 'Sokongan pelbagai arah untuk gim dan pemakaian harian.'),
  ('bbbbbbbb-1111-1111-1111-000000000013', 'ms', 'But Pergelangan Suede', 'Tekstur suede lembut untuk gaya berlapis musim luruh.'),
  ('bbbbbbbb-1111-1111-1111-000000000014', 'ms', 'Kanvas Low Klasik', 'Kanvas low-top ringan yang tidak pernah ketinggalan zaman.'),
  ('bbbbbbbb-1111-1111-1111-000000000015', 'ms', 'Pelari Stokin', 'Kolar stokin bersepadu untuk lari yang lebih rapat dan ringan.'),
  ('bbbbbbbb-1111-1111-1111-000000000016', 'ms', 'Tali Pinggang Kulit', 'Tali pinggang kulit ringkas untuk melengkapkan keseluruhan gaya.'),
  ('bbbbbbbb-1111-1111-1111-000000000017', 'ms', 'Stokin Crew 3 Helai', 'Stokin crew selesa dalam pek sedia digilir.'),
  ('bbbbbbbb-1111-1111-1111-000000000018', 'ms', 'Kit Penjagaan Kasut', 'Bersih, rawat dan poles — panjangkan hayat kasut anda.'),
  ('bbbbbbbb-1111-1111-1111-000000000019', 'ms', 'Beg Silang Mini', 'Beg silang ringan yang membebaskan tangan dan melengkapkan gaya.'),
  ('bbbbbbbb-1111-1111-1111-000000000020', 'ms', 'Topi Logo', 'Siluet baseball klasik dengan sikap MODEL MATCH.')
ON CONFLICT (product_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
