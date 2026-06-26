-- =============================================================================
-- Store Locations — table, RLS, feature flag, and Malaysian mall seed data
-- =============================================================================
-- Run in Supabase SQL Editor against your project.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  mall_name       TEXT NOT NULL,
  address_line_1  TEXT NOT NULL,
  address_line_2  TEXT,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL,
  postcode        TEXT,
  country         TEXT NOT NULL DEFAULT 'Malaysia',
  phone           TEXT,
  opening_hours   TEXT,
  latitude        NUMERIC,
  longitude       NUMERIC,
  google_maps_url TEXT,
  waze_url        TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS store_locations_active_idx
  ON public.store_locations (sort_order, name)
  WHERE deleted_at IS NULL AND active = TRUE;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.store_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_locations_public_read" ON public.store_locations;
CREATE POLICY "store_locations_public_read"
  ON public.store_locations
  FOR SELECT
  TO anon, authenticated
  USING (active = TRUE AND deleted_at IS NULL);

DROP POLICY IF EXISTS "store_locations_authenticated_insert" ON public.store_locations;
CREATE POLICY "store_locations_authenticated_insert"
  ON public.store_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "store_locations_authenticated_update" ON public.store_locations;
CREATE POLICY "store_locations_authenticated_update"
  ON public.store_locations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Feature flag
-- ---------------------------------------------------------------------------
INSERT INTO public.feature_flags (key, label, description)
VALUES (
  'store_locations',
  'Store Locations',
  'Physical store locator for customers; CRUD in web admin and staff app'
)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed — Malaysian shopping malls (idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO public.store_locations (
  name, mall_name, address_line_1, city, state, postcode,
  phone, opening_hours, google_maps_url, waze_url, sort_order, active
)
SELECT v.name, v.mall_name, v.address_line_1, v.city, v.state, v.postcode,
       v.phone, v.opening_hours, v.google_maps_url, v.waze_url, v.sort_order, TRUE
FROM (VALUES
  (
    'Model Match Pavilion KL',
    'Pavilion Kuala Lumpur',
    '168, Jalan Bukit Bintang',
    'Kuala Lumpur',
    'Wilayah Persekutuan Kuala Lumpur',
    '55100',
    '+60 3-2148 8888',
    'Mon–Sun 10:00–22:00',
    'https://maps.google.com/?q=Pavilion+Kuala+Lumpur',
    'https://waze.com/ul?q=Pavilion+Kuala+Lumpur',
    1
  ),
  (
    'Model Match Mid Valley',
    'Mid Valley Megamall',
    'Lingkaran Syed Putra',
    'Kuala Lumpur',
    'Wilayah Persekutuan Kuala Lumpur',
    '59200',
    '+60 3-2938 3333',
    'Mon–Sun 10:00–22:00',
    'https://maps.google.com/?q=Mid+Valley+Megamall',
    'https://waze.com/ul?q=Mid+Valley+Megamall',
    2
  ),
  (
    'Model Match The Gardens',
    'The Gardens Mall',
    'Mid Valley City, Lingkaran Syed Putra',
    'Kuala Lumpur',
    'Wilayah Persekutuan Kuala Lumpur',
    '59200',
    '+60 3-2287 3633',
    'Mon–Sun 10:00–22:00',
    'https://maps.google.com/?q=The+Gardens+Mall+Kuala+Lumpur',
    'https://waze.com/ul?q=The+Gardens+Mall+Kuala+Lumpur',
    3
  ),
  (
    'Model Match Sunway Pyramid',
    'Sunway Pyramid',
    '3, Jalan PJS 11/15',
    'Petaling Jaya',
    'Selangor',
    '47500',
    '+60 3-7494 3100',
    'Mon–Sun 10:00–22:00',
    'https://maps.google.com/?q=Sunway+Pyramid',
    'https://waze.com/ul?q=Sunway+Pyramid',
    4
  ),
  (
    'Model Match 1 Utama',
    '1 Utama Shopping Centre',
    '1, Lebuh Bandar Utama',
    'Petaling Jaya',
    'Selangor',
    '47800',
    '+60 3-7726 4788',
    'Mon–Sun 10:00–22:00',
    'https://maps.google.com/?q=1+Utama+Shopping+Centre',
    'https://waze.com/ul?q=1+Utama+Shopping+Centre',
    5
  ),
  (
    'Model Match IOI City Mall',
    'IOI City Mall',
    'Lebuh IRC, IOI Resort City',
    'Putrajaya',
    'Wilayah Persekutuan Putrajaya',
    '62502',
    '+60 3-8689 1000',
    'Mon–Sun 10:00–22:00',
    'https://maps.google.com/?q=IOI+City+Mall',
    'https://waze.com/ul?q=IOI+City+Mall',
    6
  ),
  (
    'Model Match Suria KLCC',
    'Suria KLCC',
    'Kuala Lumpur City Centre',
    'Kuala Lumpur',
    'Wilayah Persekutuan Kuala Lumpur',
    '50088',
    '+60 3-2382 2828',
    'Mon–Sun 10:00–22:00',
    'https://maps.google.com/?q=Suria+KLCC',
    'https://waze.com/ul?q=Suria+KLCC',
    7
  ),
  (
    'Model Match Queensbay Mall',
    'Queensbay Mall',
    '100, Persiaran Bayan Indah',
    'Bayan Lepas',
    'Penang',
    '11900',
    '+60 4-646 8888',
    'Mon–Sun 10:00–22:00',
    'https://maps.google.com/?q=Queensbay+Mall+Penang',
    'https://waze.com/ul?q=Queensbay+Mall+Penang',
    8
  ),
  (
    'Model Match Gurney Plaza',
    'Gurney Plaza',
    '170, Gurney Drive',
    'George Town',
    'Penang',
    '10250',
    '+60 4-226 3666',
    'Mon–Sun 10:00–22:00',
    'https://maps.google.com/?q=Gurney+Plaza',
    'https://waze.com/ul?q=Gurney+Plaza',
    9
  ),
  (
    'Model Match Imago KK',
    'Imago Shopping Mall',
    'Off Coastal Highway',
    'Kota Kinabalu',
    'Sabah',
    '88100',
    '+60 88-275 888',
    'Mon–Sun 10:00–22:00',
    'https://maps.google.com/?q=Imago+Shopping+Mall+Kota+Kinabalu',
    'https://waze.com/ul?q=Imago+Shopping+Mall+Kota+Kinabalu',
    10
  )
) AS v(name, mall_name, address_line_1, city, state, postcode, phone, opening_hours, google_maps_url, waze_url, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_locations sl
  WHERE sl.mall_name = v.mall_name AND sl.deleted_at IS NULL
);
