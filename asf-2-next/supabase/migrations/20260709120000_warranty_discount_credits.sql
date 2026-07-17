-- Warranty Discount Credits migration
-- Regenerate types: npx supabase gen types typescript --project-id <project-id> > src/database.types.ts
-- Mirror copy: docs/sql/step_12_warranty_discount_credits.sql
--
-- warranty_claim_type_rules deferred to v1 code config (claimPolicyConfig.ts).

-- =============================================================================
-- 1) Warranty policies
-- =============================================================================
CREATE TABLE IF NOT EXISTS warranty_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  max_warranty_days INTEGER NOT NULL DEFAULT 365,
  credit_expiry_days INTEGER NOT NULL DEFAULT 365,
  module_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warranty_policies_active ON warranty_policies(active) WHERE active = true;

-- =============================================================================
-- 2) Warranty discount tiers
-- =============================================================================
CREATE TABLE IF NOT EXISTS warranty_discount_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES warranty_policies(id) ON DELETE CASCADE,
  days_from INTEGER NOT NULL,
  days_to INTEGER NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT warranty_discount_tiers_days_range CHECK (days_from <= days_to),
  CONSTRAINT warranty_discount_tiers_percent_range CHECK (
    discount_percent >= 0 AND discount_percent <= 100
  )
);

CREATE INDEX IF NOT EXISTS idx_warranty_discount_tiers_policy_id ON warranty_discount_tiers(policy_id);

-- =============================================================================
-- 3) Extend claims table
-- =============================================================================
ALTER TABLE claims ADD COLUMN IF NOT EXISTS eligibility_start_at TIMESTAMPTZ;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS policy_id UUID REFERENCES warranty_policies(id) ON DELETE SET NULL;

-- =============================================================================
-- 4) Claim items (multi-item claims)
-- =============================================================================
CREATE TABLE IF NOT EXISTS claim_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  line_item_price_myr NUMERIC(12,2) NOT NULL,
  days_since_delivery INTEGER,
  recommended_percent NUMERIC(5,2),
  approved_percent NUMERIC(5,2),
  credit_amount_myr NUMERIC(12,2),
  warranty_credit_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (claim_id, order_item_id)
);

CREATE INDEX IF NOT EXISTS idx_claim_items_claim_id ON claim_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_items_order_item_id ON claim_items(order_item_id);

-- =============================================================================
-- 5) Warranty credits
-- =============================================================================
CREATE TABLE IF NOT EXISTS warranty_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  claim_item_id UUID NOT NULL REFERENCES claim_items(id) ON DELETE CASCADE,
  amount_myr NUMERIC(12,2) NOT NULL,
  approved_percent NUMERIC(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  issued_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warranty_credits_user_status ON warranty_credits(user_id, status);
CREATE INDEX IF NOT EXISTS idx_warranty_credits_claim_id ON warranty_credits(claim_id);
CREATE INDEX IF NOT EXISTS idx_warranty_credits_expires_at ON warranty_credits(expires_at);

-- Circular FK: claim_items.warranty_credit_id -> warranty_credits
ALTER TABLE claim_items
  DROP CONSTRAINT IF EXISTS claim_items_warranty_credit_id_fkey;
ALTER TABLE claim_items
  ADD CONSTRAINT claim_items_warranty_credit_id_fkey
  FOREIGN KEY (warranty_credit_id) REFERENCES warranty_credits(id) ON DELETE SET NULL;

-- =============================================================================
-- 6) Orders: track applied warranty credit at checkout
-- =============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS warranty_credit_id UUID REFERENCES warranty_credits(id) ON DELETE SET NULL;

-- =============================================================================
-- 7) Prevent duplicate open claims per order_item_id (trigger)
-- =============================================================================
CREATE OR REPLACE FUNCTION prevent_duplicate_open_claim_per_order_item()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM claim_items ci
    INNER JOIN claims c ON c.id = ci.claim_id
    WHERE ci.order_item_id = NEW.order_item_id
      AND ci.id IS DISTINCT FROM NEW.id
      AND c.status NOT IN ('rejected', 'resolved')
  ) THEN
    RAISE EXCEPTION 'An open claim already exists for order item %', NEW.order_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_open_claim_per_order_item ON claim_items;
CREATE TRIGGER trg_prevent_duplicate_open_claim_per_order_item
  BEFORE INSERT OR UPDATE OF order_item_id, claim_id ON claim_items
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_open_claim_per_order_item();

-- Legacy single-item claims on claims.order_item_id
CREATE OR REPLACE FUNCTION prevent_duplicate_open_claim_on_claims_order_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_item_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM claims c
    WHERE c.order_item_id = NEW.order_item_id
      AND c.id IS DISTINCT FROM NEW.id
      AND c.status NOT IN ('rejected', 'resolved')
  ) THEN
    RAISE EXCEPTION 'An open claim already exists for order item %', NEW.order_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_open_claim_on_claims ON claims;
CREATE TRIGGER trg_prevent_duplicate_open_claim_on_claims
  BEFORE INSERT OR UPDATE OF order_item_id ON claims
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_open_claim_on_claims_order_item();

-- =============================================================================
-- 8) RLS
-- =============================================================================
ALTER TABLE warranty_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_discount_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_credits ENABLE ROW LEVEL SECURITY;

-- Customers: read own warranty credits
DROP POLICY IF EXISTS warranty_credits_select_own ON warranty_credits;
CREATE POLICY warranty_credits_select_own ON warranty_credits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Customers: read claim_items via claim ownership
DROP POLICY IF EXISTS claim_items_select_via_claim ON claim_items;
CREATE POLICY claim_items_select_via_claim ON claim_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM claims c
      WHERE c.id = claim_items.claim_id
        AND c.user_id = auth.uid()
    )
  );

-- Customers: insert claim_items on own claims
DROP POLICY IF EXISTS claim_items_insert_via_claim ON claim_items;
CREATE POLICY claim_items_insert_via_claim ON claim_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM claims c
      WHERE c.id = claim_items.claim_id
        AND c.user_id = auth.uid()
    )
  );

-- Authenticated users can read active warranty policy + tiers (for estimates)
DROP POLICY IF EXISTS warranty_policies_select_authenticated ON warranty_policies;
CREATE POLICY warranty_policies_select_authenticated ON warranty_policies
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS warranty_discount_tiers_select_authenticated ON warranty_discount_tiers;
CREATE POLICY warranty_discount_tiers_select_authenticated ON warranty_discount_tiers
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- 9) Seed default policy and tiers
-- =============================================================================
INSERT INTO warranty_policies (id, name, active, max_warranty_days, credit_expiry_days, module_label)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Default Warranty Policy',
  true,
  365,
  365,
  'Warranty & Returns'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO warranty_discount_tiers (policy_id, days_from, days_to, discount_percent, sort_order)
SELECT
  'a0000000-0000-4000-8000-000000000001',
  v.days_from,
  v.days_to,
  v.discount_percent,
  v.sort_order
FROM (VALUES
  (0, 30, 75.00, 1),
  (31, 60, 50.00, 2),
  (61, 90, 25.00, 3),
  (91, 365, 10.00, 4)
) AS v(days_from, days_to, discount_percent, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM warranty_discount_tiers t
  WHERE t.policy_id = 'a0000000-0000-4000-8000-000000000001'
);
