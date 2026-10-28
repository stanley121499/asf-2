INSERT INTO public.product_translations (product_id, locale, name, description) VALUES
  ('c1010001-24a8-4f00-8000-000000000001', 'en', 'Knit Mary Jane Buckle Flat', 'Premium Knit Mary Jane Buckle Flat — Simon curated flat for everyday Malaysian retail.'),
  ('c1010001-24a8-4f00-8000-000000000001', 'ms', 'Kasut Mary Jane Knit Buckle', 'Kasut Mary Jane Knit Buckle premium untuk gaya harian.'),
  ('c1010001-24a8-4f00-8000-000000000002', 'en', 'Knit Ballet X-Strap Flat', 'Premium Knit Ballet X-Strap Flat — Simon curated flat for everyday Malaysian retail.'),
  ('c1010001-24a8-4f00-8000-000000000002', 'ms', 'Kasut Ballet Knit X-Strap', 'Kasut Ballet Knit X-Strap premium untuk gaya harian.'),
  ('c1010001-24a8-4f00-8000-000000000003', 'en', 'Knit Ankle Strap Flat', 'Premium Knit Ankle Strap Flat — Simon curated flat for everyday Malaysian retail.'),
  ('c1010001-24a8-4f00-8000-000000000003', 'ms', 'Kasut Knit Ankle Strap', 'Kasut Knit Ankle Strap premium untuk gaya harian.'),
  ('c1010001-24a8-4f00-8000-000000000004', 'en', 'Satin Ankle Strap Flat', 'Premium Satin Ankle Strap Flat — Simon curated flat for everyday Malaysian retail.'),
  ('c1010001-24a8-4f00-8000-000000000004', 'ms', 'Kasut Satin Ankle Strap', 'Kasut Satin Ankle Strap premium untuk gaya harian.'),
  ('c1010001-24a8-4f00-8000-000000000005', 'en', 'Satin Mary Jane Flat', 'Premium Satin Mary Jane Flat — Simon curated flat for everyday Malaysian retail.'),
  ('c1010001-24a8-4f00-8000-000000000005', 'ms', 'Kasut Mary Jane Satin', 'Kasut Mary Jane Satin premium untuk gaya harian.'),
  ('c1010001-24a8-4f00-8000-000000000006', 'en', 'Satin Ballet X-Strap Flat', 'Premium Satin Ballet X-Strap Flat — Simon curated flat for everyday Malaysian retail.'),
  ('c1010001-24a8-4f00-8000-000000000006', 'ms', 'Kasut Ballet Satin X-Strap', 'Kasut Ballet Satin X-Strap premium untuk gaya harian.')
ON CONFLICT (product_id, locale) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW();
