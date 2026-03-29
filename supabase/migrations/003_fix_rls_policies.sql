-- ============================================
-- FIX: RLS policies — restrict service role inserts
-- Previously used WITH CHECK (true) which allows anon inserts
-- ============================================

-- Sales
DROP POLICY IF EXISTS "Service role inserts sales" ON sales;
CREATE POLICY "Service role inserts sales" ON sales
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Webhook logs
DROP POLICY IF EXISTS "Service role inserts webhook_logs" ON webhook_logs;
CREATE POLICY "Service role inserts webhook_logs" ON webhook_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Visitor identities
DROP POLICY IF EXISTS "Service role inserts visitor_identities" ON visitor_identities;
CREATE POLICY "Service role inserts visitor_identities" ON visitor_identities
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role updates visitor_identities" ON visitor_identities;
CREATE POLICY "Service role updates visitor_identities" ON visitor_identities
  FOR UPDATE USING (auth.role() = 'service_role');

-- Purchases
DROP POLICY IF EXISTS "Service role inserts purchases" ON purchases;
CREATE POLICY "Service role inserts purchases" ON purchases
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Gateway events
DROP POLICY IF EXISTS "Service role inserts gateway_events" ON gateway_events;
CREATE POLICY "Service role inserts gateway_events" ON gateway_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- EMQ daily
DROP POLICY IF EXISTS "Service role inserts emq_daily" ON emq_daily;
CREATE POLICY "Service role inserts emq_daily" ON emq_daily
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role updates emq_daily" ON emq_daily;
CREATE POLICY "Service role updates emq_daily" ON emq_daily
  FOR UPDATE USING (auth.role() = 'service_role');

-- Gateway audit log
DROP POLICY IF EXISTS "Service role inserts gateway_audit_log" ON gateway_audit_log;
CREATE POLICY "Service role inserts gateway_audit_log" ON gateway_audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
