-- =============================================================================
-- Expo Customer Notifications — schema, RLS, and transactional template seeds
-- =============================================================================
-- Purpose: Create push_tokens, notification_templates, notification_preferences,
--   notification_campaigns; add user_details.preferred_locale; seed templates for
--   all transactional types × locales (zh-CN, en, ms).
-- Apply before Agents 2–8 (createCustomerNotification, producers, admin, Expo).
-- notifications table: unchanged (no schema change).
-- Idempotent: safe to re-run (IF NOT EXISTS / ON CONFLICT DO UPDATE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) push_tokens
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  app TEXT NOT NULL CHECK (app IN ('customer', 'staff')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT push_tokens_user_platform_app_unique UNIQUE (user_id, platform, app)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id
  ON public.push_tokens (user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_tokens_select_own ON public.push_tokens;
CREATE POLICY push_tokens_select_own
  ON public.push_tokens
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS push_tokens_insert_own ON public.push_tokens;
CREATE POLICY push_tokens_insert_own
  ON public.push_tokens
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS push_tokens_update_own ON public.push_tokens;
CREATE POLICY push_tokens_update_own
  ON public.push_tokens
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS push_tokens_delete_own ON public.push_tokens;
CREATE POLICY push_tokens_delete_own
  ON public.push_tokens
  FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2) notification_templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en', 'ms')),
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT notification_templates_type_locale_unique UNIQUE (type, locale)
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_type
  ON public.notification_templates (type);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Authenticated read (optional client preview); writes via service role / staff API only
DROP POLICY IF EXISTS notification_templates_select_authenticated ON public.notification_templates;
CREATE POLICY notification_templates_select_authenticated
  ON public.notification_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- 3) notification_preferences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  orders_push BOOLEAN NOT NULL DEFAULT TRUE,
  claims_push BOOLEAN NOT NULL DEFAULT TRUE,
  promotions BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_preferences_select_own ON public.notification_preferences;
CREATE POLICY notification_preferences_select_own
  ON public.notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_insert_own ON public.notification_preferences;
CREATE POLICY notification_preferences_insert_own
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_update_own ON public.notification_preferences;
CREATE POLICY notification_preferences_update_own
  ON public.notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_delete_own ON public.notification_preferences;
CREATE POLICY notification_preferences_delete_own
  ON public.notification_preferences
  FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4) user_details.preferred_locale
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_details
  ADD COLUMN IF NOT EXISTS preferred_locale TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_details_preferred_locale_check'
  ) THEN
    ALTER TABLE public.user_details
      ADD CONSTRAINT user_details_preferred_locale_check
      CHECK (
        preferred_locale IS NULL
        OR preferred_locale IN ('zh-CN', 'en', 'ms')
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5) notification_campaigns
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  body_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_locale TEXT NOT NULL CHECK (default_locale IN ('zh-CN', 'en', 'ms')),
  deep_link TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER,
  error_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_status
  ON public.notification_campaigns (status);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_created_at
  ON public.notification_campaigns (created_at DESC);

ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;

-- No permissive policies for anon/authenticated — staff API uses service role (bypasses RLS).
-- Intentionally no client INSERT/UPDATE/DELETE/SELECT.

-- ---------------------------------------------------------------------------
-- 6) Seed notification_templates (type × locale) — re-run safe
-- ---------------------------------------------------------------------------
INSERT INTO public.notification_templates (type, locale, title_template, body_template)
VALUES
  -- order_confirmed
  (
    'order_confirmed',
    'en',
    'Order confirmed',
    'Your order {{order_label}} has been confirmed. We will keep you updated on its progress.'
  ),
  (
    'order_confirmed',
    'zh-CN',
    '订单已确认',
    '您的订单 {{order_label}} 已确认。我们会持续通知您订单进度。'
  ),
  (
    'order_confirmed',
    'ms',
    'Pesanan disahkan',
    'Pesanan anda {{order_label}} telah disahkan. Kami akan memaklumkan kemajuan pesanan anda.'
  ),

  -- payment_failed
  (
    'payment_failed',
    'en',
    'Payment failed',
    'We could not complete your payment{{amount_label}}. Please try again or use a different payment method.'
  ),
  (
    'payment_failed',
    'zh-CN',
    '付款失败',
    '我们无法完成您的付款{{amount_label}}。请重试或更换付款方式。'
  ),
  (
    'payment_failed',
    'ms',
    'Pembayaran gagal',
    'Kami tidak dapat menyelesaikan pembayaran anda{{amount_label}}. Sila cuba lagi atau gunakan kaedah pembayaran lain.'
  ),

  -- order_fulfillment_error
  (
    'order_fulfillment_error',
    'en',
    'Order processing issue',
    'There was a problem fulfilling order {{order_label}}. Our team has been notified and will follow up.'
  ),
  (
    'order_fulfillment_error',
    'zh-CN',
    '订单处理异常',
    '订单 {{order_label}} 履约时出现问题。我们的团队已收到通知并将跟进。'
  ),
  (
    'order_fulfillment_error',
    'ms',
    'Isu pemprosesan pesanan',
    'Terdapat masalah memenuhi pesanan {{order_label}}. Pasukan kami telah dimaklumkan dan akan susulan.'
  ),

  -- order_status_changed
  (
    'order_status_changed',
    'en',
    'Order status updated',
    'Order {{order_label}} is now {{status_label}} ({{old_status}} → {{new_status}}).'
  ),
  (
    'order_status_changed',
    'zh-CN',
    '订单状态已更新',
    '订单 {{order_label}} 现为 {{status_label}}（{{old_status}} → {{new_status}}）。'
  ),
  (
    'order_status_changed',
    'ms',
    'Status pesanan dikemas kini',
    'Pesanan {{order_label}} kini {{status_label}} ({{old_status}} → {{new_status}}).'
  ),

  -- claim_created
  (
    'claim_created',
    'en',
    'Claim submitted',
    'Your claim {{claim_label}} has been submitted. We will review it shortly.'
  ),
  (
    'claim_created',
    'zh-CN',
    '理赔已提交',
    '您的理赔 {{claim_label}} 已提交。我们将尽快审核。'
  ),
  (
    'claim_created',
    'ms',
    'Tuntutan dihantar',
    'Tuntutan anda {{claim_label}} telah dihantar. Kami akan semak tidak lama lagi.'
  ),

  -- claim_status_changed
  (
    'claim_status_changed',
    'en',
    'Claim status updated',
    'Claim {{claim_label}} is now {{status_label}}.'
  ),
  (
    'claim_status_changed',
    'zh-CN',
    '理赔状态已更新',
    '理赔 {{claim_label}} 现为 {{status_label}}。'
  ),
  (
    'claim_status_changed',
    'ms',
    'Status tuntutan dikemas kini',
    'Tuntutan {{claim_label}} kini {{status_label}}.'
  ),

  -- warranty_credit_issued
  (
    'warranty_credit_issued',
    'en',
    'Warranty credit issued',
    'A warranty credit of RM {{amount_rm}} has been issued for claim {{claim_label}}.'
  ),
  (
    'warranty_credit_issued',
    'zh-CN',
    '保修抵扣已发放',
    '理赔 {{claim_label}} 已发放 RM {{amount_rm}} 保修抵扣。'
  ),
  (
    'warranty_credit_issued',
    'ms',
    'Kredit waranti dikeluarkan',
    'Kredit waranti sebanyak RM {{amount_rm}} telah dikeluarkan untuk tuntutan {{claim_label}}.'
  ),

  -- warranty_registration_activated
  (
    'warranty_registration_activated',
    'en',
    'Warranty activated',
    'Warranty registration {{registration_label}} is active (code {{code}}).'
  ),
  (
    'warranty_registration_activated',
    'zh-CN',
    '保修已激活',
    '保修登记 {{registration_label}} 已激活（激活码 {{code}}）。'
  ),
  (
    'warranty_registration_activated',
    'ms',
    'Waranti diaktifkan',
    'Pendaftaran waranti {{registration_label}} kini aktif (kod {{code}}).'
  ),

  -- warranty_registration_claimed
  (
    'warranty_registration_claimed',
    'en',
    'Warranty voucher ready',
    'Your warranty registration {{registration_label}} voucher of RM {{amount_rm}} is ready (code {{code}}).'
  ),
  (
    'warranty_registration_claimed',
    'zh-CN',
    '保修凭证已就绪',
    '保修登记 {{registration_label}} 的 RM {{amount_rm}} 凭证已就绪（激活码 {{code}}）。'
  ),
  (
    'warranty_registration_claimed',
    'ms',
    'Baucar waranti sedia',
    'Baucar RM {{amount_rm}} untuk pendaftaran waranti {{registration_label}} sedia (kod {{code}}).'
  ),

  -- ticket_created
  (
    'ticket_created',
    'en',
    'Support ticket created',
    'Your support ticket {{ticket_label}} has been created. Our team will reply soon.'
  ),
  (
    'ticket_created',
    'zh-CN',
    '支持工单已创建',
    '您的支持工单 {{ticket_label}} 已创建。我们的团队将尽快回复。'
  ),
  (
    'ticket_created',
    'ms',
    'Tiket sokongan dicipta',
    'Tiket sokongan anda {{ticket_label}} telah dicipta. Pasukan kami akan membalas tidak lama lagi.'
  ),

  -- ticket_replied
  (
    'ticket_replied',
    'en',
    'New reply on your ticket',
    'There is a new reply on support ticket {{ticket_label}}.'
  ),
  (
    'ticket_replied',
    'zh-CN',
    '工单有新回复',
    '支持工单 {{ticket_label}} 有新的回复。'
  ),
  (
    'ticket_replied',
    'ms',
    'Balasan baharu pada tiket',
    'Terdapat balasan baharu pada tiket sokongan {{ticket_label}}.'
  )
ON CONFLICT (type, locale) DO UPDATE
SET
  title_template = EXCLUDED.title_template,
  body_template = EXCLUDED.body_template,
  updated_at = NOW();
