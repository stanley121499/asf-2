-- Physical Warranty Registration (Agent 1 handoff for Agent 2)
-- Regenerate types: npx supabase gen types typescript --project-id <project-id> > src/database.types.ts
-- Mirror copy: docs/sql/step_13_physical_warranty_registration.sql
-- Seed helper: docs/sql/SEED_WARRANTY_ACTIVATION_CODES.sql
--
-- Tables / columns (exact names for Agent 2):
--   warranty_activation_codes(
--     id, code, product_id, product_color_id, product_size_id, batch_label,
--     status ['unused'|'used'|'void'], used_at, used_by_user_id, registration_id, created_at
--   )
--   warranty_registrations(
--     id, user_id, activation_code_id, product_id, product_color_id, product_size_id,
--     purchase_date, purchase_store_id, customer_name, customer_email, customer_phone,
--     staff_name, receipt_url, original_pair_price_myr, policy_id,
--     status ['active'|'claimed'|'expired'|'void'], claimed_at, warranty_credit_id,
--     created_at, updated_at
--   )
--   warranty_credits extensions:
--     registration_id, redemption_code, redemption_channel ['online'|'in_store'],
--     redeemed_store_id, redeemed_by_staff_id;
--     claim_id / claim_item_id made NULLABLE
--   CHECK warranty_credits_source_check:
--     (claim_item_id IS NOT NULL) OR (registration_id IS NOT NULL)

-- =============================================================================
-- 1) warranty_activation_codes
-- =============================================================================
CREATE TABLE IF NOT EXISTS warranty_activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_color_id UUID,
  product_size_id UUID,
  batch_label TEXT,
  status TEXT NOT NULL DEFAULT 'unused'
    CHECK (status IN ('unused', 'used', 'void')),
  used_at TIMESTAMPTZ,
  used_by_user_id UUID,
  registration_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT warranty_activation_codes_code_upper CHECK (code = upper(code))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_warranty_activation_codes_code_unique
  ON warranty_activation_codes (code);

CREATE INDEX IF NOT EXISTS idx_warranty_activation_codes_status
  ON warranty_activation_codes (status);

CREATE INDEX IF NOT EXISTS idx_warranty_activation_codes_product_id
  ON warranty_activation_codes (product_id);

-- =============================================================================
-- 2) warranty_registrations
-- =============================================================================
CREATE TABLE IF NOT EXISTS warranty_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activation_code_id UUID NOT NULL UNIQUE REFERENCES warranty_activation_codes(id),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_color_id UUID,
  product_size_id UUID,
  purchase_date DATE NOT NULL,
  purchase_store_id UUID NOT NULL REFERENCES store_locations(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  staff_name TEXT,
  receipt_url TEXT,
  original_pair_price_myr NUMERIC(12,2) NOT NULL,
  policy_id UUID REFERENCES warranty_policies(id),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'claimed', 'expired', 'void')),
  claimed_at TIMESTAMPTZ,
  warranty_credit_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warranty_registrations_user_id
  ON warranty_registrations (user_id);

CREATE INDEX IF NOT EXISTS idx_warranty_registrations_status
  ON warranty_registrations (status);

CREATE INDEX IF NOT EXISTS idx_warranty_registrations_purchase_store_id
  ON warranty_registrations (purchase_store_id);

CREATE INDEX IF NOT EXISTS idx_warranty_registrations_product_id
  ON warranty_registrations (product_id);

-- Circular FK: activation_codes.registration_id -> registrations
ALTER TABLE warranty_activation_codes
  DROP CONSTRAINT IF EXISTS warranty_activation_codes_registration_id_fkey;
ALTER TABLE warranty_activation_codes
  ADD CONSTRAINT warranty_activation_codes_registration_id_fkey
  FOREIGN KEY (registration_id) REFERENCES warranty_registrations(id) ON DELETE SET NULL;

-- =============================================================================
-- 3) Extend warranty_credits for registration vouchers + in-store redeem
-- =============================================================================
ALTER TABLE warranty_credits
  ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES warranty_registrations(id) ON DELETE SET NULL;

ALTER TABLE warranty_credits
  ADD COLUMN IF NOT EXISTS redemption_code TEXT;

ALTER TABLE warranty_credits
  ADD COLUMN IF NOT EXISTS redemption_channel TEXT;

ALTER TABLE warranty_credits
  ADD COLUMN IF NOT EXISTS redeemed_store_id UUID REFERENCES store_locations(id) ON DELETE SET NULL;

ALTER TABLE warranty_credits
  ADD COLUMN IF NOT EXISTS redeemed_by_staff_id UUID;

-- Soften legacy NOT NULL so registration-issued credits need no claim rows
ALTER TABLE warranty_credits
  ALTER COLUMN claim_id DROP NOT NULL;

ALTER TABLE warranty_credits
  ALTER COLUMN claim_item_id DROP NOT NULL;

-- Redemption channel values (NULL until redeemed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'warranty_credits_redemption_channel_check'
      AND conrelid = 'warranty_credits'::regclass
  ) THEN
    ALTER TABLE warranty_credits
      ADD CONSTRAINT warranty_credits_redemption_channel_check
      CHECK (
        redemption_channel IS NULL
        OR redemption_channel IN ('online', 'in_store')
      );
  END IF;
END $$;

-- Each credit must link to either a claim_item (online path) OR a registration (physical path)
ALTER TABLE warranty_credits
  DROP CONSTRAINT IF EXISTS warranty_credits_source_check;
ALTER TABLE warranty_credits
  ADD CONSTRAINT warranty_credits_source_check
  CHECK (
    (claim_item_id IS NOT NULL) OR (registration_id IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_warranty_credits_redemption_code_unique
  ON warranty_credits (redemption_code)
  WHERE redemption_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_warranty_credits_registration_id
  ON warranty_credits (registration_id);

CREATE INDEX IF NOT EXISTS idx_warranty_credits_redeemed_store_id
  ON warranty_credits (redeemed_store_id);

-- Circular FK: registrations.warranty_credit_id -> warranty_credits
ALTER TABLE warranty_registrations
  DROP CONSTRAINT IF EXISTS warranty_registrations_warranty_credit_id_fkey;
ALTER TABLE warranty_registrations
  ADD CONSTRAINT warranty_registrations_warranty_credit_id_fkey
  FOREIGN KEY (warranty_credit_id) REFERENCES warranty_credits(id) ON DELETE SET NULL;

-- =============================================================================
-- 4) updated_at helper for registrations
-- =============================================================================
CREATE OR REPLACE FUNCTION set_warranty_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_warranty_registrations_updated_at ON warranty_registrations;
CREATE TRIGGER trg_warranty_registrations_updated_at
  BEFORE UPDATE ON warranty_registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_warranty_registrations_updated_at();

-- =============================================================================
-- 5) RLS
-- =============================================================================
ALTER TABLE warranty_activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_registrations ENABLE ROW LEVEL SECURITY;

-- Activation codes: no client SELECT/INSERT/UPDATE (service role / API only)
DROP POLICY IF EXISTS warranty_activation_codes_deny_all ON warranty_activation_codes;
-- Intentionally no permissive policies for authenticated/anon.
-- Service role bypasses RLS.

-- Customers: read own registrations only (writes via server API + service role)
DROP POLICY IF EXISTS warranty_registrations_select_own ON warranty_registrations;
CREATE POLICY warranty_registrations_select_own ON warranty_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- warranty_credits: keep existing select-own; no client INSERT/UPDATE
-- (issuance + redeem remain server-side / service role)
DROP POLICY IF EXISTS warranty_credits_select_own ON warranty_credits;
CREATE POLICY warranty_credits_select_own ON warranty_credits
  FOR SELECT
  USING (auth.uid() = user_id);
