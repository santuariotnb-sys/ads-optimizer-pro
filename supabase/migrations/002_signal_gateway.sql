-- ============================================
-- SIGNAL GATEWAY — Schema
-- ============================================

-- ============================================
-- VISITOR IDENTITIES (first-party data store)
-- ============================================
CREATE TABLE visitor_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_hash TEXT,
  phone_hash TEXT,
  external_id_hash TEXT,
  email_encrypted TEXT,
  fbp TEXT,
  fbc TEXT,
  session_id TEXT,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  purchase_count INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  predicted_ltv DECIMAL(12,2) DEFAULT 0,
  customer_type TEXT DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE visitor_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own visitor_identities" ON visitor_identities
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role inserts visitor_identities" ON visitor_identities
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role updates visitor_identities" ON visitor_identities
  FOR UPDATE USING (true);

CREATE UNIQUE INDEX idx_visitor_email_user ON visitor_identities(user_id, email_hash) WHERE email_hash IS NOT NULL;
CREATE INDEX idx_visitor_fbp ON visitor_identities(user_id, fbp) WHERE fbp IS NOT NULL;
CREATE INDEX idx_visitor_session ON visitor_identities(user_id, session_id) WHERE session_id IS NOT NULL;

-- ============================================
-- PURCHASES (fonte de verdade financeira)
-- ============================================
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_hash TEXT,
  order_id TEXT,
  value DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  items JSONB,
  bump_accepted BOOLEAN DEFAULT false,
  upsell_accepted BOOLEAN DEFAULT false,
  upsell_value DECIMAL(12,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'approved',
  event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own purchases" ON purchases
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role inserts purchases" ON purchases
  FOR INSERT WITH CHECK (true);

CREATE UNIQUE INDEX idx_purchases_order ON purchases(user_id, order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_purchases_email ON purchases(user_id, email_hash) WHERE email_hash IS NOT NULL;

-- ============================================
-- FUNNEL CONFIG (por usuário/produto)
-- ============================================
CREATE TABLE funnel_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  funnel_name TEXT NOT NULL DEFAULT 'Meu Funil',
  funnel_type TEXT DEFAULT 'infoproduct',
  front_price DECIMAL(10,2) DEFAULT 0,
  bump1_price DECIMAL(10,2) DEFAULT 0,
  bump1_rate DECIMAL(5,4) DEFAULT 0,
  bump2_price DECIMAL(10,2) DEFAULT 0,
  bump2_rate DECIMAL(5,4) DEFAULT 0,
  upsell_price DECIMAL(10,2) DEFAULT 0,
  upsell_rate DECIMAL(5,4) DEFAULT 0,
  downsell_price DECIMAL(10,2) DEFAULT 0,
  downsell_rate DECIMAL(5,4) DEFAULT 0,
  pixel_id TEXT,
  capi_token_encrypted TEXT,
  gateway_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE funnel_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own funnel_config" ON funnel_config
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- GATEWAY EVENTS (log de eventos enviados)
-- ============================================
CREATE TABLE gateway_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  funnel_id UUID REFERENCES funnel_config(id) ON DELETE SET NULL,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_source_url TEXT,
  has_email BOOLEAN DEFAULT false,
  has_phone BOOLEAN DEFAULT false,
  has_external_id BOOLEAN DEFAULT false,
  has_fbp BOOLEAN DEFAULT false,
  has_fbc BOOLEAN DEFAULT false,
  emq_estimate DECIMAL(4,1) DEFAULT 0,
  value DECIMAL(12,2),
  currency TEXT DEFAULT 'BRL',
  customer_type TEXT,
  predicted_ltv DECIMAL(12,2),
  meta_response_status INTEGER,
  meta_response_body JSONB,
  delivery_attempts INTEGER DEFAULT 1,
  pixel_also_fired BOOLEAN DEFAULT false,
  client_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gateway_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own gateway_events" ON gateway_events
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role inserts gateway_events" ON gateway_events
  FOR INSERT WITH CHECK (true);

CREATE UNIQUE INDEX idx_gateway_event_id ON gateway_events(user_id, event_id);
CREATE INDEX idx_gateway_event_name ON gateway_events(event_name, created_at DESC);
CREATE INDEX idx_gateway_delivery ON gateway_events(meta_response_status, created_at DESC);
CREATE INDEX idx_gateway_user_date ON gateway_events(user_id, created_at DESC);

-- ============================================
-- EMQ DAILY (dashboard de qualidade)
-- ============================================
CREATE TABLE emq_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  pixel_id TEXT,
  events_total INTEGER DEFAULT 0,
  events_with_email INTEGER DEFAULT 0,
  events_with_phone INTEGER DEFAULT 0,
  events_with_external_id INTEGER DEFAULT 0,
  events_with_fbp INTEGER DEFAULT 0,
  events_with_fbc INTEGER DEFAULT 0,
  avg_emq_estimate DECIMAL(4,1) DEFAULT 0,
  recovery_count INTEGER DEFAULT 0,
  delivery_success INTEGER DEFAULT 0,
  delivery_failed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE emq_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own emq_daily" ON emq_daily
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role inserts emq_daily" ON emq_daily
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role updates emq_daily" ON emq_daily
  FOR UPDATE USING (true);

CREATE UNIQUE INDEX idx_emq_daily_unique ON emq_daily(user_id, date, pixel_id);

-- ============================================
-- GATEWAY AUDIT LOG
-- ============================================
CREATE TABLE gateway_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  event_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gateway_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own gateway_audit_log" ON gateway_audit_log
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role inserts gateway_audit_log" ON gateway_audit_log
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_audit_user_date ON gateway_audit_log(user_id, created_at DESC);

-- ============================================
-- VIEWS
-- ============================================

-- Resumo diário do Gateway
CREATE OR REPLACE VIEW gateway_daily_summary AS
SELECT
  user_id,
  created_at::DATE AS date,
  event_name,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE has_email) AS with_email,
  COUNT(*) FILTER (WHERE has_phone) AS with_phone,
  COUNT(*) FILTER (WHERE has_external_id) AS with_external_id,
  COUNT(*) FILTER (WHERE has_fbp) AS with_fbp,
  COUNT(*) FILTER (WHERE has_fbc) AS with_fbc,
  ROUND(AVG(emq_estimate), 1) AS avg_emq,
  COUNT(*) FILTER (WHERE meta_response_status = 200) AS delivered,
  COUNT(*) FILTER (WHERE meta_response_status != 200 OR meta_response_status IS NULL) AS failed,
  COUNT(*) FILTER (WHERE NOT pixel_also_fired) AS recovered,
  COALESCE(SUM(value), 0) AS total_value
FROM gateway_events
GROUP BY user_id, created_at::DATE, event_name;

-- Pipeline do funil
CREATE OR REPLACE VIEW gateway_funnel_pipeline AS
SELECT
  user_id,
  created_at::DATE AS date,
  COUNT(*) FILTER (WHERE event_name = 'PageView') AS pageviews,
  COUNT(*) FILTER (WHERE event_name = 'ViewContent') AS view_content,
  COUNT(*) FILTER (WHERE event_name = 'Lead') AS leads,
  COUNT(*) FILTER (WHERE event_name = 'InitiateCheckout') AS initiate_checkout,
  COUNT(*) FILTER (WHERE event_name = 'Purchase') AS purchases,
  COALESCE(SUM(value) FILTER (WHERE event_name = 'Purchase'), 0) AS purchase_value
FROM gateway_events
GROUP BY user_id, created_at::DATE;

-- ============================================
-- FUNCTION: Atualizar EMQ daily (chamada via cron ou edge function)
-- ============================================
CREATE OR REPLACE FUNCTION update_emq_daily(p_user_id UUID, p_date DATE, p_pixel_id TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO emq_daily (user_id, date, pixel_id, events_total, events_with_email, events_with_phone, events_with_external_id, events_with_fbp, events_with_fbc, avg_emq_estimate, recovery_count, delivery_success, delivery_failed)
  SELECT
    p_user_id,
    p_date,
    p_pixel_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE has_email),
    COUNT(*) FILTER (WHERE has_phone),
    COUNT(*) FILTER (WHERE has_external_id),
    COUNT(*) FILTER (WHERE has_fbp),
    COUNT(*) FILTER (WHERE has_fbc),
    ROUND(AVG(emq_estimate), 1),
    COUNT(*) FILTER (WHERE NOT pixel_also_fired),
    COUNT(*) FILTER (WHERE meta_response_status = 200),
    COUNT(*) FILTER (WHERE meta_response_status != 200 OR meta_response_status IS NULL)
  FROM gateway_events
  WHERE user_id = p_user_id
    AND created_at::DATE = p_date
  ON CONFLICT (user_id, date, pixel_id)
  DO UPDATE SET
    events_total = EXCLUDED.events_total,
    events_with_email = EXCLUDED.events_with_email,
    events_with_phone = EXCLUDED.events_with_phone,
    events_with_external_id = EXCLUDED.events_with_external_id,
    events_with_fbp = EXCLUDED.events_with_fbp,
    events_with_fbc = EXCLUDED.events_with_fbc,
    avg_emq_estimate = EXCLUDED.avg_emq_estimate,
    recovery_count = EXCLUDED.recovery_count,
    delivery_success = EXCLUDED.delivery_success,
    delivery_failed = EXCLUDED.delivery_failed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
