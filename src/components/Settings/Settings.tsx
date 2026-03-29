import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Settings as SettingsIcon, Link2, Webhook, CheckCircle2,
  Copy, RefreshCw, Eye, EyeOff, Globe, Clock, Target, DollarSign,
  Calendar, Bell, Shield,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { getIntegrations, upsertIntegration, getWebhookUrl, getWebhookStats, type Integration } from '../../services/integrationService';
import { supabase } from '../../lib/supabase';
import { COLORS, COLORS_LIGHT } from '../../utils/constants';

const PROVIDERS = [
  { id: 'utmify', label: 'Utmify', desc: 'Rastreamento UTM e atribuição de vendas' },
  { id: 'meta', label: 'Meta Ads', desc: 'Facebook & Instagram Ads (Marketing API)' },
  { id: 'hotmart', label: 'Hotmart', desc: 'Plataforma de infoprodutos' },
  { id: 'kiwify', label: 'Kiwify', desc: 'Plataforma de vendas digitais' },
  { id: 'monetizze', label: 'Monetizze', desc: 'Plataforma de afiliados' },
] as const;

export default function Settings() {
  const theme = useStore((s) => s.theme);
  const mode = useStore((s) => s.mode);
  const isMobile = useIsMobile();
  const c = theme === 'dark' ? COLORS : COLORS_LIGHT;

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhookStats, setWebhookStats] = useState<{ total: number; processed: number; failed: number; lastReceived: string | null } | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'integrations' | 'general' | 'notifications'>('integrations');
  const [profile, setProfile] = useState({ timezone: 'America/Sao_Paulo', currency: 'BRL', default_roas_target: 3.0, default_cpa_target: 50, closing_day: 1 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>({ 'In-App': true, 'Email': false, 'WhatsApp': false, 'Telegram': false });
  const push = usePushNotifications();

  useEffect(() => {
    if (mode !== 'live') return;
    let cancelled = false;
    (async () => {
      try {
        const [ints, stats] = await Promise.all([getIntegrations(), getWebhookStats()]);
        if (cancelled) return;
        setIntegrations(ints);
        setWebhookStats(stats);

        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled || !user) return;
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (cancelled || !profileData) return;
        const p = profileData as Record<string, unknown>;
        setProfile({
          timezone: (p.timezone as string) || 'America/Sao_Paulo',
          currency: (p.currency as string) || 'BRL',
          default_roas_target: Number(p.default_roas_target || 3),
          default_cpa_target: Number(p.default_cpa_target || 50),
          closing_day: Number(p.closing_day || 1),
        });
      } catch {
        // Demo mode — no Supabase
      }
    })();
    return () => { cancelled = true; };
  }, [mode, refreshKey]);

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function getIntegration(provider: string): Integration | undefined {
    return integrations.find(i => i.provider === provider);
  }

  async function handleConnect(provider: string) {
    if (provider === 'meta') {
      const appId = import.meta.env.VITE_META_APP_ID;
      const redirectUri = import.meta.env.VITE_META_REDIRECT_URI || window.location.origin + '/auth/callback';
      window.location.assign(`https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=ads_read,ads_management,read_insights&response_type=token`);
      return;
    }
    await upsertIntegration(provider, {});
    setRefreshKey(k => k + 1);
  }

  async function handleSaveProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('profiles').update(profile as Record<string, unknown>).eq('id', user.id);
    } catch {
      // Silently fail in demo mode
    }
  }

  const tabs = [
    { id: 'integrations' as const, label: 'Integrações', icon: Link2 },
    { id: 'general' as const, label: 'Geral', icon: SettingsIcon },
    { id: 'notifications' as const, label: 'Notificações', icon: Bell },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SettingsIcon size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Configurações</h1>
          <p style={{ fontSize: 13, color: c.textMuted }}>Integrações, preferências e notificações</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: c.surface2, border: `1px solid ${c.border}` }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? c.accent : 'transparent',
              color: activeTab === tab.id ? '#fff' : c.textMuted,
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <tab.icon size={16} />
            {!isMobile && tab.label}
          </button>
        ))}
      </div>

      {/* Integrações */}
      {activeTab === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PROVIDERS.map((provider, i) => {
            const integration = getIntegration(provider.id);
            const isConnected = !!integration?.is_active;
            const webhookUrl = integration ? getWebhookUrl(integration.webhook_secret) : '';
            const showToken = showTokens[provider.id];

            return (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card"
                style={{ padding: 20, borderRadius: 16, background: c.surface2, border: `1px solid ${c.border}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: isConnected ? c.success : c.textMuted }} />
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{provider.label}</h3>
                      <p style={{ fontSize: 12, color: c.textMuted }}>{provider.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnect(provider.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: isConnected ? 'rgba(74,222,128,0.15)' : c.accent,
                      color: isConnected ? c.success : '#fff',
                    }}
                  >
                    {isConnected ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} /> Conectado</span>
                    ) : (
                      'Conectar'
                    )}
                  </button>
                </div>

                {isConnected && provider.id === 'utmify' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12, borderTop: `1px solid ${c.border}` }}>
                    {/* Webhook URL */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
                        <Webhook size={12} style={{ marginRight: 4 }} />
                        Webhook URL
                      </label>
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <input
                          readOnly
                          value={showToken ? webhookUrl : webhookUrl.replace(/token=.*/, 'token=••••••••')}
                          style={{
                            flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${c.border}`,
                            background: c.surface3, color: c.text, fontSize: 12, fontFamily: 'JetBrains Mono',
                          }}
                        />
                        <button onClick={() => setShowTokens(s => ({ ...s, [provider.id]: !s[provider.id] }))} style={{ padding: '8px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.surface3, color: c.textMuted, cursor: 'pointer' }}>
                          {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => copyToClipboard(webhookUrl, `webhook-${provider.id}`)} style={{ padding: '8px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.surface3, color: copiedField === `webhook-${provider.id}` ? c.success : c.textMuted, cursor: 'pointer' }}>
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    {webhookStats && (
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
                        {[
                          { label: 'Total recebidos', value: webhookStats.total, color: c.text },
                          { label: 'Processados', value: webhookStats.processed, color: c.success },
                          { label: 'Falharam', value: webhookStats.failed, color: c.danger },
                          { label: 'Último', value: webhookStats.lastReceived ? new Date(webhookStats.lastReceived).toLocaleString('pt-BR') : '—', color: c.textSecondary },
                        ].map(stat => (
                          <div key={stat.label} style={{ padding: 12, borderRadius: 10, background: c.surface3, textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: stat.color, fontFamily: 'Space Grotesk' }}>{stat.value}</div>
                            <div style={{ fontSize: 11, color: c.textMuted }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {isConnected && provider.id === 'meta' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: `1px solid ${c.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: c.textMuted }}>Ad Account ID</span>
                      <span style={{ fontSize: 12, color: c.text, fontFamily: 'JetBrains Mono' }}>{integration?.ad_account_id || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: c.textMuted }}>Última sincronização</span>
                      <span style={{ fontSize: 12, color: c.text }}>{integration?.last_sync_at ? new Date(integration.last_sync_at).toLocaleString('pt-BR') : '—'}</span>
                    </div>
                    <button style={{ marginTop: 4, padding: '8px 12px', borderRadius: 8, border: `1px solid ${c.border}`, background: 'transparent', color: c.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RefreshCw size={14} /> Reconectar
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* General */}
      {activeTab === 'general' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ padding: 24, borderRadius: 16, background: c.surface2, border: `1px solid ${c.border}` }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color={c.accent} /> Preferências Gerais
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 20 }}>
            {[
              { label: 'Fuso Horário', icon: Clock, value: profile.timezone, key: 'timezone', type: 'select', options: ['America/Sao_Paulo', 'America/Fortaleza', 'America/Manaus', 'America/Cuiaba'] },
              { label: 'Moeda', icon: DollarSign, value: profile.currency, key: 'currency', type: 'select', options: ['BRL', 'USD', 'EUR'] },
              { label: 'Meta ROAS Padrão', icon: Target, value: profile.default_roas_target, key: 'default_roas_target', type: 'number', suffix: 'x' },
              { label: 'Meta CPA Padrão', icon: DollarSign, value: profile.default_cpa_target, key: 'default_cpa_target', type: 'number', prefix: 'R$' },
              { label: 'Dia de Fechamento', icon: Calendar, value: profile.closing_day, key: 'closing_day', type: 'number' },
              { label: 'Idioma', icon: Globe, value: 'Português (BR)', key: 'lang', type: 'text', disabled: true },
            ].map(field => (
              <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <field.icon size={14} /> {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={String(field.value)}
                    onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.surface3, color: c.text, fontSize: 13 }}
                  >
                    {field.options!.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={String(field.value)}
                    disabled={field.disabled}
                    onChange={e => setProfile(p => ({ ...p, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.surface3, color: c.text, fontSize: 13, fontFamily: field.type === 'number' ? 'JetBrains Mono' : 'inherit' }}
                  />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveProfile}
            style={{ marginTop: 24, padding: '12px 24px', borderRadius: 10, border: 'none', background: c.accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Salvar Preferências
          </button>
        </motion.div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ padding: 24, borderRadius: 16, background: c.surface2, border: `1px solid ${c.border}` }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={16} color={c.accent} /> Canais de Notificação
          </h3>
          {/* Push Notifications (real) */}
          {push.isSupported && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: `1px solid ${c.border}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Push (Celular)</div>
                <div style={{ fontSize: 12, color: c.textMuted }}>
                  {push.permission === 'denied'
                    ? 'Bloqueado pelo navegador — ative nas configurações do dispositivo'
                    : 'Notificações push no celular ao vivo'}
                </div>
              </div>
              <div
                onClick={() => {
                  if (push.permission === 'denied' || push.isLoading) return;
                  if (push.isSubscribed) push.unsubscribe();
                  else push.subscribe();
                }}
                style={{
                  width: 44, height: 24, borderRadius: 12, position: 'relative',
                  cursor: push.permission === 'denied' ? 'not-allowed' : 'pointer',
                  opacity: push.permission === 'denied' ? 0.5 : 1,
                  background: push.isSubscribed ? c.accent : c.surface3, transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                  left: push.isSubscribed ? 23 : 3, transition: 'left 0.2s',
                }} />
              </div>
            </div>
          )}

          {/* Other channels */}
          {[
            { label: 'In-App', desc: 'Notificações dentro da plataforma' },
            { label: 'Email', desc: 'Alertas enviados para seu email' },
            { label: 'WhatsApp', desc: 'Notificações via WhatsApp Business API' },
            { label: 'Telegram', desc: 'Alertas via Telegram Bot' },
          ].map((channel, i) => {
            const enabled = notifToggles[channel.label] ?? false;
            return (
              <div key={channel.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i < 3 ? `1px solid ${c.border}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{channel.label}</div>
                  <div style={{ fontSize: 12, color: c.textMuted }}>{channel.desc}</div>
                </div>
                <div
                  onClick={() => setNotifToggles(prev => ({ ...prev, [channel.label]: !prev[channel.label] }))}
                  style={{
                    width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative',
                    background: enabled ? c.accent : c.surface3, transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                    left: enabled ? 23 : 3, transition: 'left 0.2s',
                  }} />
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
