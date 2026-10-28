INSERT INTO public.post_translations (post_id, locale, name, caption) VALUES
  ('c2010001-24a8-4f00-8000-000000000001', 'en', 'Hotel Lobby · Knit Mary Jane', '奶油针织玛丽珍，轻盈步伐开启新日。'),
  ('c2010001-24a8-4f00-8000-000000000002', 'en', 'Gallery Walk · X-Strap Ballet', '黑色针织交叉带，艺术空间里的利落剪影。'),
  ('c2010001-24a8-4f00-8000-000000000003', 'en', 'Garden Wedding · Ankle Strap', '腮红针织踝带，温柔出席每一场仪式。'),
  ('c2010001-24a8-4f00-8000-000000000004', 'en', 'Riverside Blue Hour · Satin Ankle', '奶油缎面踝带，暮光里的柔软光泽。'),
  ('c2010001-24a8-4f00-8000-000000000005', 'en', 'Tram Stop · Satin Mary Jane', '黑粉缎面玛丽珍，都市夜色通勤灵感。'),
  ('c2010001-24a8-4f00-8000-000000000006', 'en', 'Laundry Balcony · Satin Ballet', '奶油缎面交叉带，晨光里的日常诗意。'),
  ('c2010001-24a8-4f00-8000-000000000007', 'en', 'Rainy Café · Black Mary Jane', '黑色针织扣带，雨窗旁的沉稳节奏。'),
  ('c2010001-24a8-4f00-8000-000000000008', 'en', 'Sculpture Courtyard · Beige X-Strap', '米色针织芭蕾，石柱光影中的自在步伐。'),
  ('c2010001-24a8-4f00-8000-000000000009', 'en', 'Jazz Club Stairs · Black-Pink Ballet', '黑粉缎面交叉带，阶梯上的夜色轻舞。'),
  ('c2010001-24a8-4f00-8000-000000000010', 'en', 'Conservatory Light · Cream Mary Jane', '奶油缎面玛丽珍，植物光影里的温柔停留。')
ON CONFLICT (post_id, locale) DO UPDATE SET
  name = EXCLUDED.name, caption = EXCLUDED.caption;
