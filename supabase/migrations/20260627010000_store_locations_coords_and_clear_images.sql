-- Backfill mall coordinates and remove placeholder online images.
-- Run after store_locations seed; safe to re-run (idempotent updates).

UPDATE public.store_locations SET image_urls = '{}' WHERE deleted_at IS NULL;

UPDATE public.store_locations SET latitude = 3.1490, longitude = 101.7133
WHERE mall_name = 'Pavilion Kuala Lumpur' AND deleted_at IS NULL;

UPDATE public.store_locations SET latitude = 3.1175, longitude = 101.6770
WHERE mall_name = 'Mid Valley Megamall' AND deleted_at IS NULL;

UPDATE public.store_locations SET latitude = 3.1185, longitude = 101.6755
WHERE mall_name = 'The Gardens Mall' AND deleted_at IS NULL;

UPDATE public.store_locations SET latitude = 3.0730, longitude = 101.6075
WHERE mall_name = 'Sunway Pyramid' AND deleted_at IS NULL;

UPDATE public.store_locations SET latitude = 3.1466, longitude = 101.6150
WHERE mall_name = '1 Utama Shopping Centre' AND deleted_at IS NULL;

UPDATE public.store_locations SET latitude = 2.9700, longitude = 101.7130
WHERE mall_name = 'IOI City Mall' AND deleted_at IS NULL;

UPDATE public.store_locations SET latitude = 3.1578, longitude = 101.7123
WHERE mall_name = 'Suria KLCC' AND deleted_at IS NULL;

UPDATE public.store_locations SET latitude = 5.3336, longitude = 100.3067
WHERE mall_name = 'Queensbay Mall' AND deleted_at IS NULL;

UPDATE public.store_locations SET latitude = 5.4374, longitude = 100.3095
WHERE mall_name = 'Gurney Plaza' AND deleted_at IS NULL;

UPDATE public.store_locations SET latitude = 5.9706, longitude = 116.0659
WHERE mall_name = 'Imago Shopping Mall' AND deleted_at IS NULL;
