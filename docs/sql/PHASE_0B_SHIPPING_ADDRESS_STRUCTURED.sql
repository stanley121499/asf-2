-- Phase 0b — Structured shipping address on orders
--
-- Why: orders.shipping_address is TEXT (display-only). The Delyva
-- create-shipment API requires structured fields: address1, city, state,
-- postcode, country. This JSONB column stores the machine-readable version
-- alongside the human-readable TEXT column.
--
-- Run this before starting Phase 3 (Checkout rewrite).
-- Shape stored in the column:
--   {
--     "address1": "28 Jalan 5",
--     "address2": "Unit 3",          (optional)
--     "city":     "Kajang",
--     "state":    "Selangor",
--     "postcode": "43000",
--     "country":  "MY"
--   }

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_address_structured JSONB;

COMMENT ON COLUMN orders.shipping_address_structured
  IS 'Structured shipping address for Delyva API: { address1, address2?, city, state, postcode, country }';
