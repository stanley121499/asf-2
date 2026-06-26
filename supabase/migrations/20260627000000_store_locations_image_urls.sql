-- Add multi-image support to store_locations.
-- Customers can browse several photos (different angles) of each physical store.

ALTER TABLE public.store_locations
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.store_locations.image_urls IS
  'Ordered list of public image URLs for the store (first is the cover/hero).';
