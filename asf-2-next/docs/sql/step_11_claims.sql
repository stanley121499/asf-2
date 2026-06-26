-- Step 11 — Post-Purchase Claims module (run in Supabase SQL editor)

-- =============================================================================
-- 1) Claims table
-- =============================================================================
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  claim_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  reason TEXT,
  description TEXT,
  evidence_urls TEXT[] NOT NULL DEFAULT '{}',
  requested_resolution TEXT,
  approved_resolution TEXT,
  rejection_reason TEXT,
  staff_notes TEXT,
  assigned_agent_id UUID,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_order_id ON claims(order_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);

-- =============================================================================
-- 2) Claim status audit log
-- =============================================================================
CREATE TABLE IF NOT EXISTS claim_status_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_status_logs_claim_id ON claim_status_change_logs(claim_id);

-- =============================================================================
-- 3) Feature flag seed
-- =============================================================================
INSERT INTO feature_flags (key, label, description, enabled)
VALUES (
  'claims',
  'Post-Purchase Claims',
  'Customer warranty/returns claims and staff review queue',
  true
)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description;

-- =============================================================================
-- 4) RLS (basic — authenticated users see own claims; staff see all via service role)
-- =============================================================================
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_status_change_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS claims_select_own ON claims;
CREATE POLICY claims_select_own ON claims
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS claims_insert_own ON claims;
CREATE POLICY claims_insert_own ON claims
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS claims_update_own ON claims;
CREATE POLICY claims_update_own ON claims
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS claim_logs_select_via_claim ON claim_status_change_logs;
CREATE POLICY claim_logs_select_via_claim ON claim_status_change_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM claims c
      WHERE c.id = claim_status_change_logs.claim_id
        AND c.user_id = auth.uid()
    )
  );
