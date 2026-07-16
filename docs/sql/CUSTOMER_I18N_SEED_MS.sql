-- Customer App i18n — Malay seed data (locale = 'ms')
--
-- Prerequisites: Run CUSTOMER_I18N_TRANSLATION_TABLES.sql and CUSTOMER_I18N_MS_MIGRATION.sql first.
-- Entity UUIDs match the live ASF-2 catalog (gswszoljvafugtdikimn) as of 2026-07-08.
-- Safe to re-run: uses ON CONFLICT ... DO UPDATE.

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT INTO category_translations (category_id, locale, name) VALUES
  ('aaaaaaaa-1111-1111-1111-000000000001', 'ms', 'Minuman'),
  ('aaaaaaaa-1111-1111-1111-000000000002', 'ms', 'Snek & Makanan'),
  ('aaaaaaaa-1111-1111-1111-000000000003', 'ms', 'Penjagaan Diri'),
  ('aaaaaaaa-1111-1111-1111-000000000004', 'ms', 'Barangan Rumah')
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
  ('cccccccc-1111-1111-1111-000000000001', 'ms', 'Keperluan Menonton Berjamaah', 'Pek menonton berjamaah terbaik! Pelbagai coklat kegemaran untuk setiap episod — lebih manis dijamin.', 'Beli sekarang'),
  ('cccccccc-1111-1111-1111-000000000002', 'ms', 'Relaks Musim Panas', 'Soda limau pudina sejuk bersalji dengan ais — satu teguk hilangkan kepanasan.', 'Sejukkan diri'),
  ('cccccccc-1111-1111-1111-000000000003', 'ms', 'Pilihan Teh Tanah Tinggi', 'Teh hitam tanah tinggi organik dengan aroma kaya dan selepas rasa yang tahan lama. Ganjaran petang terbaik untuk diri sendiri.', 'Rasa teh'),
  ('cccccccc-1111-1111-1111-000000000004', 'ms', 'Juara Malam Ramen', 'Siapa boleh menahan semangkuk ramen pedas Korea yang menggebu? Kuah pekat, mi kenyal — MVP snek tengah malam.', 'Stokkan'),
  ('cccccccc-1111-1111-1111-000000000005', 'ms', 'Biji Kopi Panggang Dalam', 'Mulakan pagi dengan mengisar secawan biji kopi khas panggang dalam. Penuhi rumah dengan aroma kopi yang kaya.', 'Beli kopi'),
  ('cccccccc-1111-1111-1111-000000000006', 'ms', 'Cold Brew, Tegukan Lembut', 'Kopi cold brew kedai — tanpa gula, sifar kalori, rendah asid dan lembut. Dicipta untuk pencinta kopi.', 'Bawa pulang')
ON CONFLICT (post_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  caption = EXCLUDED.caption,
  cta_text = EXCLUDED.cta_text,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Products (20 live demo products)
-- ---------------------------------------------------------------------------
INSERT INTO product_translations (product_id, locale, name, description) VALUES
  ('bbbbbbbb-1111-1111-1111-000000000001', 'ms', 'Coca-Cola Klasik', 'Rasa klasik yang segar, tegas dan abadi'),
  ('bbbbbbbb-1111-1111-1111-000000000002', 'ms', 'Biji Kopi Panggang Premium', 'Panggang dalam dengan aroma kaya dan tahan lama'),
  ('bbbbbbbb-1111-1111-1111-000000000003', 'ms', 'Teh Hitam Organik Tanah Tinggi', 'Ditanam secara organik dengan selepas rasa manis'),
  ('bbbbbbbb-1111-1111-1111-000000000004', 'ms', 'Kopi Cold Brew', 'Lembut dan rendah asid — kesegaran musim panas'),
  ('bbbbbbbb-1111-1111-1111-000000000005', 'ms', 'Soda Limau Pudina', 'Segar, rangup dan hilangkan kepanasan'),
  ('bbbbbbbb-1111-1111-1111-000000000006', 'ms', 'Latte Artisan', 'Buih lembut dicampur dengan espresso pekat'),
  ('bbbbbbbb-1111-1111-1111-000000000007', 'ms', 'Ramen Pedas Korea', 'Mi kenyal dalam kuah pedas yang kaya'),
  ('bbbbbbbb-1111-1111-1111-000000000008', 'ms', 'Pelbagai Coklat', 'Termasuk Mars, KitKat dan jualan terlaris lain'),
  ('bbbbbbbb-1111-1111-1111-000000000009', 'ms', 'Biskut Mentega', 'Aroma mentega kaya yang cair di mulut'),
  ('bbbbbbbb-1111-1111-1111-000000000010', 'ms', 'Kerepek Kentang Rangup', 'Kerepek rangup — snek menonton berjamaah yang sempurna'),
  ('bbbbbbbb-1111-1111-1111-000000000011', 'ms', 'Kacang Campuran', 'Sihat, sedap dan berkhasiat sepenuhnya'),
  ('bbbbbbbb-1111-1111-1111-000000000012', 'ms', 'Bar Granola Panggang', 'Serat tinggi, lemak rendah — pengganti hidangan sihat'),
  ('bbbbbbbb-1111-1111-1111-000000000013', 'ms', 'Popcorn Pek Keluarga', 'Karamel manis — suasana pawagam di rumah'),
  ('bbbbbbbb-1111-1111-1111-000000000014', 'ms', 'Pencuci Badan Berkhasiat', 'Essen susu untuk kulit lembut dan lembap'),
  ('bbbbbbbb-1111-1111-1111-000000000015', 'ms', 'Ubat Gigi Herba', 'Penjagaan gusi dengan pudina herba segar'),
  ('bbbbbbbb-1111-1111-1111-000000000016', 'ms', 'Syampu Minyak Pati', 'Memperbaiki kualiti rambut dan melicinkan kusut'),
  ('bbbbbbbb-1111-1111-1111-000000000017', 'ms', 'Detergen Pembersihan Dalam', 'Pembersihan berkesan dengan tindakan antibakteria 99.9%'),
  ('bbbbbbbb-1111-1111-1111-000000000018', 'ms', 'Pencuci Pinggan Lemon', 'Satu titis sudah cukup — lembut pada tangan'),
  ('bbbbbbbb-1111-1111-1111-000000000019', 'ms', 'Tisu Premium', '3-lapis tebal — kekal kukuh apabila basah'),
  ('bbbbbbbb-1111-1111-1111-000000000020', 'ms', 'Pembersih Pelbagai Permukaan', 'Sesuai untuk dapur dan bilik mandi')
ON CONFLICT (product_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
