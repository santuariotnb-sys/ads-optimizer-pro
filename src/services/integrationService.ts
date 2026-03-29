import { supabase } from '../lib/supabase';

export interface Integration {
  id: string;
  provider: string;
  is_active: boolean;
  webhook_secret: string;
  ad_account_id: string | null;
  pixel_id: string | null;
  last_sync_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface WebhookLog {
  status: string;
  created_at: string;
}

export async function getIntegrations(): Promise<Integration[]> {
  const { data, error } = await supabase
    .from('integrations')
    .select('id, provider, is_active, webhook_secret, ad_account_id, pixel_id, last_sync_at, metadata, created_at')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as Integration[];
}

export async function upsertIntegration(provider: string, input: {
  access_token?: string;
  ad_account_id?: string;
  pixel_id?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('integrations')
    .upsert(
      { user_id: user.id, provider, ...input, is_active: true } as Record<string, unknown>,
      { onConflict: 'user_id,provider' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteIntegration(id: string) {
  const { error } = await supabase.from('integrations').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleIntegration(id: string, is_active: boolean) {
  const { error } = await supabase
    .from('integrations')
    .update({ is_active } as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

export function getWebhookUrl(webhookSecret: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  return `${supabaseUrl}/functions/v1/utmify-webhook?token=${webhookSecret}`;
}

export async function getWebhookStats() {
  const { data, error } = await supabase
    .from('webhook_logs')
    .select('status, created_at')
    .eq('source', 'utmify')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  const logs = (data || []) as WebhookLog[];

  return {
    total: logs.length,
    processed: logs.filter(l => l.status === 'processed').length,
    failed: logs.filter(l => l.status === 'failed').length,
    duplicate: logs.filter(l => l.status === 'duplicate').length,
    lastReceived: logs[0]?.created_at || null,
  };
}
