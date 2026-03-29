-- ============================================
-- ADS OPTIMIZER PRO — Schema Inicial
-- ============================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  currency TEXT DEFAULT 'BRL',
  default_roas_target NUMERIC(6,2) DEFAULT 3.0,
  default_cpa_target NUMERIC(10,2) DEFAULT 50.00,
  closing_day INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INTEGRATIONS
-- ============================================
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'meta', 'utmify', 'google_ads', 'hotmart', 'kiwify'
  access_token TEXT,
  refresh_token TEXT,
  ad_account_id TEXT,
  pixel_id TEXT,
  token_expires_at TIMESTAMPTZ,
  webhook_secret TEXT DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own integrations" ON integrations
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- SALES (Utmify webhook data)
-- ============================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  platform TEXT, -- 'hotmart', 'monetizze', 'kiwify', 'eduzz', etc.
  payment_method TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2),
  commission NUMERIC(12,2),
  currency TEXT DEFAULT 'BRL',
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  product_name TEXT,
  product_id TEXT,
  -- UTM fields
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  src TEXT,
  sck TEXT,
  -- Timestamps
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_date TIMESTAMPTZ,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, external_id)
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own sales" ON sales
  FOR ALL USING (auth.uid() = user_id);

-- Service role can insert (for webhook Edge Function)
CREATE POLICY "Service role inserts sales" ON sales
  FOR INSERT WITH CHECK (true);

-- ============================================
-- CAMPAIGNS (synced from Meta)
-- ============================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meta_campaign_id TEXT NOT NULL,
  name TEXT,
  status TEXT,
  objective TEXT,
  daily_budget NUMERIC(10,2),
  lifetime_budget NUMERIC(10,2),
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, meta_campaign_id)
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own campaigns" ON campaigns
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- CAMPAIGN METRICS (daily snapshots)
-- ============================================
CREATE TABLE campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  spend NUMERIC(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  purchase_value NUMERIC(12,2) DEFAULT 0,
  add_to_cart INTEGER DEFAULT 0,
  initiate_checkout INTEGER DEFAULT 0,
  view_content INTEGER DEFAULT 0,
  cpa NUMERIC(10,2),
  roas NUMERIC(6,2),
  ctr NUMERIC(6,4),
  cpc NUMERIC(10,4),
  cpm NUMERIC(10,2),
  frequency NUMERIC(6,2),
  video_p25 INTEGER DEFAULT 0,
  video_p50 INTEGER DEFAULT 0,
  video_p75 INTEGER DEFAULT 0,
  video_p100 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, date)
);

ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own campaign_metrics" ON campaign_metrics
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- EXPENSES (custos fixos/variáveis)
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'meta_ads', 'google_ads', 'equipe', 'ferramentas', 'criativos', 'impostos', 'outros'
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurring_day INTEGER,
  reference_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- ALERTS (persistent)
-- ============================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'critical', 'warning', 'info', 'success'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metric_name TEXT,
  threshold NUMERIC,
  current_value NUMERIC,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own alerts" ON alerts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- ALERT RULES (configuráveis pelo usuário)
-- ============================================
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  operator TEXT NOT NULL, -- '>', '<', '>=', '<=', '=='
  threshold NUMERIC NOT NULL,
  period_hours INTEGER DEFAULT 24,
  channels JSONB DEFAULT '["in_app"]',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own alert_rules" ON alert_rules
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- WEBHOOK LOGS (audit trail)
-- ============================================
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  event_type TEXT,
  status TEXT DEFAULT 'received',
  payload JSONB NOT NULL,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own webhook_logs" ON webhook_logs
  FOR ALL USING (auth.uid() = user_id);
-- Service role can insert
CREATE POLICY "Service role inserts webhook_logs" ON webhook_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_sales_user_date ON sales(user_id, sale_date DESC);
CREATE INDEX idx_sales_user_utm ON sales(user_id, utm_source, utm_campaign);
CREATE INDEX idx_sales_user_status ON sales(user_id, status);
CREATE INDEX idx_sales_user_external ON sales(user_id, external_id);
CREATE INDEX idx_campaign_metrics_campaign_date ON campaign_metrics(campaign_id, date DESC);
CREATE INDEX idx_campaign_metrics_user_date ON campaign_metrics(user_id, date);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, reference_date);
CREATE INDEX idx_alerts_user_active ON alerts(user_id, dismissed, created_at DESC);
CREATE INDEX idx_webhook_logs_user ON webhook_logs(user_id, created_at DESC);

-- ============================================
-- VIEWS para Dashboard
-- ============================================

-- Resumo de vendas por período
CREATE OR REPLACE VIEW sales_summary AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE status = 'approved') AS total_sales,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_sales,
  COUNT(*) FILTER (WHERE status = 'refunded') AS refunded_sales,
  COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS gross_revenue,
  COALESCE(SUM(net_amount) FILTER (WHERE status = 'approved'), 0) AS net_revenue,
  COALESCE(SUM(commission) FILTER (WHERE status = 'approved'), 0) AS total_commission,
  COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0) AS refunded_amount,
  CASE
    WHEN COUNT(*) FILTER (WHERE status = 'approved') > 0
    THEN SUM(amount) FILTER (WHERE status = 'approved') / COUNT(*) FILTER (WHERE status = 'approved')
    ELSE 0
  END AS avg_ticket,
  sale_date::DATE AS date
FROM sales
GROUP BY user_id, sale_date::DATE;

-- DRE simplificado mensal
CREATE OR REPLACE VIEW monthly_dre AS
SELECT
  s.user_id,
  DATE_TRUNC('month', s.sale_date)::DATE AS month,
  COALESCE(SUM(s.amount) FILTER (WHERE s.status = 'approved'), 0) AS receita_bruta,
  COALESCE(SUM(s.commission) FILTER (WHERE s.status = 'approved'), 0) AS taxas_plataforma,
  COALESCE(SUM(s.amount) FILTER (WHERE s.status = 'refunded'), 0) AS reembolsos,
  COALESCE(SUM(s.amount) FILTER (WHERE s.status = 'approved'), 0)
    - COALESCE(SUM(s.commission) FILTER (WHERE s.status = 'approved'), 0)
    - COALESCE(SUM(s.amount) FILTER (WHERE s.status = 'refunded'), 0) AS receita_liquida
FROM sales s
GROUP BY s.user_id, DATE_TRUNC('month', s.sale_date);

-- UTM Source ranking
CREATE OR REPLACE VIEW utm_ranking AS
SELECT
  user_id,
  utm_source,
  utm_medium,
  utm_campaign,
  COUNT(*) FILTER (WHERE status = 'approved') AS vendas,
  COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS receita,
  COALESCE(AVG(amount) FILTER (WHERE status = 'approved'), 0) AS ticket_medio
FROM sales
WHERE utm_source IS NOT NULL
GROUP BY user_id, utm_source, utm_medium, utm_campaign;
