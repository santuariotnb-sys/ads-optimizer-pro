-- 007_workspaces.sql
-- Tabela de workspaces referenciada pelo OnboardingWizard e workspaceService

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  checkout_domain TEXT,
  business_type TEXT,
  pixel_meta_id TEXT,
  pixel_google_id TEXT,
  pixel_tiktok_id TEXT,
  pixel_kwai_id TEXT,
  capi_token_encrypted TEXT,
  utm_source_default TEXT DEFAULT 'direct',
  utm_medium_default TEXT DEFAULT 'organic',
  events_config JSONB DEFAULT '{}',
  destinations JSONB DEFAULT '{}',
  tracking_script TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  setup_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own workspaces"
  ON workspaces FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_workspaces_active ON workspaces(user_id, is_active) WHERE is_active = true;
