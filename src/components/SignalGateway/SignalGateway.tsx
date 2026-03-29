import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Zap, Radio, Shield, TrendingUp, Mail, Phone, User,
  Fingerprint, MousePointer, Link2, Copy, Check, Settings,
  ArrowRight, Activity, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import {
  fetchGatewayStats, fetchGatewayPipeline, fetchFunnelConfig,
  saveFunnelConfig, calculateEPV, generateTrackingScript,
  type GatewayStats, type GatewayPipeline, type FunnelConfig,
} from '../../services/gatewayService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

type Tab = 'dashboard' | 'funnel' | 'script';

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,.34)',
  backdropFilter: 'blur(28px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,.55)',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 30px 120px -45px rgba(15,23,42,.26), inset 0 1px 0 rgba(255,255,255,.92)',
};

const emqItems = [
  { key: 'email', label: 'Email', icon: Mail, weight: '+2.0', field: 'eventsWithEmail' as const },
  { key: 'phone', label: 'Telefone', icon: Phone, weight: '+1.5', field: 'eventsWithPhone' as const },
  { key: 'external_id', label: 'External ID', icon: User, weight: '+1.5', field: 'eventsWithExternalId' as const },
  { key: 'fbp', label: 'FBP Cookie', icon: Fingerprint, weight: '+0.5', field: 'eventsWithFbp' as const },
  { key: 'fbc', label: 'FBC Click', icon: MousePointer, weight: '+0.5', field: 'eventsWithFbc' as const },
];

const pipelineStages = [
  { key: 'pageviews', label: 'PageView', field: 'pageviews' as const },
  { key: 'viewContent', label: 'ViewContent', field: 'viewContent' as const },
  { key: 'leads', label: 'Lead', field: 'leads' as const },
  { key: 'initiateCheckout', label: 'Checkout', field: 'initiateCheckout' as const },
  { key: 'purchases', label: 'Purchase', field: 'purchases' as const },
];

const funnelTypes = [
  { value: 'infoproduct', label: 'Infoproduto' },
  { value: 'dropship', label: 'Dropshipping' },
  { value: 'saas', label: 'SaaS' },
  { value: 'leadgen', label: 'Lead Gen' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'custom', label: 'Personalizado' },
];

export default function SignalGateway() {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<GatewayStats | null>(null);
  const [pipeline, setPipeline] = useState<GatewayPipeline | null>(null);
  const [funnel, setFunnel] = useState<Partial<FunnelConfig>>({
    funnel_name: 'Meu Funil',
    funnel_type: 'infoproduct',
    front_price: 0, bump1_price: 0, bump1_rate: 0, bump2_price: 0, bump2_rate: 0,
    upsell_price: 0, upsell_rate: 0, downsell_price: 0, downsell_rate: 0,
    pixel_id: '', capi_token_encrypted: '', gateway_url: '',
    is_active: true,
  });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [s, p, f] = await Promise.all([
      fetchGatewayStats('7d'),
      fetchGatewayPipeline('7d'),
      fetchFunnelConfig(),
    ]);
    setStats(s);
    setPipeline(p);
    if (f) setFunnel(f);
  }

  async function handleSaveFunnel() {
    setSaving(true);
    setSaveMsg('');
    const { error } = await saveFunnelConfig(funnel);
    setSaving(false);
    if (error) {
      setSaveMsg(`Erro: ${error}`);
    } else {
      setSaveMsg('Salvo com sucesso!');
      const f = await fetchFunnelConfig();
      if (f) setFunnel(f);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  }

  function handleCopyScript() {
    const url = funnel.gateway_url || `${SUPABASE_URL}/functions/v1/collect`;
    const script = generateTrackingScript(url, funnel.id || 'CONFIGURE_FUNNEL_FIRST');
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const epv = calculateEPV(funnel);
  const recoveryRate = stats && stats.eventsTotal > 0
    ? Math.round((stats.recoveryCount / stats.eventsTotal) * 100) : 0;
  const matchRate = stats && stats.eventsTotal > 0
    ? Math.round(((stats.eventsWithEmail + stats.eventsWithPhone) / stats.eventsTotal / 2) * 100) : 0;
  const deliveryRate = stats && stats.eventsTotal > 0
    ? Math.round((stats.deliverySuccess / stats.eventsTotal) * 100) : 0;

  const tabs: { id: Tab; label: string; icon: typeof Zap }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'funnel', label: 'Configurar Funil', icon: Settings },
    { id: 'script', label: 'Script da LP', icon: Link2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(99,102,241,0.3)',
          }}>
            <Zap size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif", margin: 0, letterSpacing: '-0.02em' }}>
              Signal Gateway
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              Server-side tracking + CAPI enriquecido
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 20,
          background: stats && stats.eventsTotal > 0 ? 'rgba(74, 222, 128, 0.08)' : 'rgba(15,23,42,0.04)',
          border: `1px solid ${stats && stats.eventsTotal > 0 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(15,23,42,0.08)'}`,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: stats && stats.eventsTotal > 0 ? '#4ade80' : '#525252',
            boxShadow: stats && stats.eventsTotal > 0 ? '0 0 8px rgba(74,222,128,0.6)' : 'none',
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: stats && stats.eventsTotal > 0 ? '#4ade80' : '#737373', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {stats && stats.eventsTotal > 0 ? 'Live' : 'Aguardando eventos'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(15,23,42,0.04)', borderRadius: 12 }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: active ? '#a5b4fc' : '#64748b',
                fontSize: 13, fontWeight: active ? 600 : 500,
                fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} />
              {!isMobile && t.label}
            </button>
          );
        })}
      </div>

      {tab === 'dashboard' && <DashboardTab stats={stats} pipeline={pipeline} recoveryRate={recoveryRate} matchRate={matchRate} deliveryRate={deliveryRate} epv={epv} funnel={funnel} isMobile={isMobile} />}
      {tab === 'funnel' && <FunnelTab funnel={funnel} setFunnel={setFunnel} epv={epv} saving={saving} saveMsg={saveMsg} onSave={handleSaveFunnel} isMobile={isMobile} />}
      {tab === 'script' && <ScriptTab funnel={funnel} copied={copied} onCopy={handleCopyScript} isMobile={isMobile} />}
    </motion.div>
  );
}

/* ============ DASHBOARD TAB ============ */
function DashboardTab({ stats, pipeline, recoveryRate, matchRate, deliveryRate, epv, funnel, isMobile }: {
  stats: GatewayStats | null; pipeline: GatewayPipeline | null;
  recoveryRate: number; matchRate: number; deliveryRate: number;
  epv: number; funnel: Partial<FunnelConfig>; isMobile: boolean;
}) {
  const metricCards = [
    { label: 'EMQ Score', value: stats?.avgEmq?.toFixed(1) || '0', sub: '/10', color: getEmqColor(stats?.avgEmq || 0), icon: Shield },
    { label: 'Eventos', value: formatNumber(stats?.eventsTotal || 0), sub: '/7d', color: '#6366f1', icon: Radio },
    { label: 'Match Rate', value: `${matchRate}%`, sub: 'email+phone', color: '#60a5fa', icon: Fingerprint },
    { label: 'Recovery', value: `+${recoveryRate}%`, sub: 'vs pixel', color: '#4ade80', icon: TrendingUp },
  ];

  return (
    <>
      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 16 }}>
        {metricCards.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ ...glassCard, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                <Icon size={16} style={{ color: m.color, opacity: 0.7 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: m.color, fontFamily: "'Space Grotesk', sans-serif" }}>{m.value}</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{m.sub}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Funnel Info Bar */}
      {funnel.funnel_name && (
        <div style={{ ...glassCard, padding: 16, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 12 : 24, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>FUNIL:</span>
          <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{funnel.funnel_name}</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>Front: {formatCurrency(Number(funnel.front_price || 0))}</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>EPV: {formatCurrency(epv)}</span>
        </div>
      )}

      {/* Pipeline + EMQ Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* Pipeline */}
        <div style={glassCard}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>Pipeline Hoje</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pipelineStages.map((stage, i) => {
              const count = pipeline?.[stage.field] || 0;
              const maxCount = pipeline?.pageviews || 1;
              const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
              return (
                <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: '#64748b', width: 90, fontFamily: "'JetBrains Mono', monospace" }}>{stage.label}</span>
                  <div style={{ flex: 1, height: 8, background: 'rgba(15,23,42,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      style={{ height: '100%', background: `linear-gradient(90deg, #6366f1, #8b5cf6)`, borderRadius: 4 }}
                    />
                  </div>
                  <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", width: 50, textAlign: 'right' }}>{formatNumber(count)}</span>
                  <span style={{ fontSize: 11, color: '#64748b', width: 35, textAlign: 'right' }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* EMQ Breakdown */}
        <div style={glassCard}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>EMQ Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {emqItems.map(item => {
              const count = stats?.[item.field] || 0;
              const total = stats?.eventsTotal || 1;
              const pct = Math.round((count / total) * 100);
              const Icon = item.icon;
              return (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={14} style={{ color: '#6366f1', opacity: 0.6, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#94a3b8', width: 80, fontFamily: "'Outfit', sans-serif" }}>{item.label}</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(15,23,42,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? '#4ade80' : pct >= 40 ? '#facc15' : '#f87171', borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600, width: 32, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{item.weight}</span>
                  <span style={{ fontSize: 11, color: pct >= 70 ? '#4ade80' : '#64748b', width: 35, textAlign: 'right' }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delivery Status */}
      <div style={{ ...glassCard, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 12 : 24, flexDirection: isMobile ? 'column' : 'row' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>DELIVERY STATUS</span>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <StatusBadge icon={Check} label="Enviados" value={stats?.deliverySuccess || 0} color="#4ade80" />
            <StatusBadge icon={AlertTriangle} label="Falha" value={stats?.deliveryFailed || 0} color="#f87171" />
            <StatusBadge icon={RefreshCw} label="Recuperados" value={stats?.recoveryCount || 0} color="#60a5fa" />
            <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
              Delivery: <span style={{ color: deliveryRate >= 95 ? '#4ade80' : '#facc15', fontWeight: 600 }}>{deliveryRate}%</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ icon: Icon, label, value, color }: { icon: typeof Check; label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon size={14} style={{ color }} />
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "'Space Grotesk', sans-serif" }}>{formatNumber(value)}</span>
    </div>
  );
}

/* ============ FUNNEL TAB ============ */
function FunnelTab({ funnel, setFunnel, epv, saving, saveMsg, onSave, isMobile }: {
  funnel: Partial<FunnelConfig>; setFunnel: (f: Partial<FunnelConfig>) => void;
  epv: number; saving: boolean; saveMsg: string;
  onSave: () => void; isMobile: boolean;
}) {
  const update = (key: keyof FunnelConfig, value: string | number | boolean) => {
    setFunnel({ ...funnel, [key]: value });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid rgba(15,23,42,0.1)', background: 'rgba(15,23,42,0.03)',
    color: '#0f172a', fontSize: 14, fontFamily: "'Outfit', sans-serif",
    outline: 'none', transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 6,
    fontFamily: "'Outfit', sans-serif", display: 'block',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Basic Info */}
      <div style={glassCard}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>Informações do Funil</h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nome do Funil</label>
            <input style={inputStyle} value={funnel.funnel_name || ''} onChange={e => update('funnel_name', e.target.value)} placeholder="Ex: Terapia Neural Bíblica" />
          </div>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={funnel.funnel_type || 'infoproduct'} onChange={e => update('funnel_type', e.target.value)}>
              {funnelTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Funnel Values */}
      <div style={glassCard}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>Valores do Funil</h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Front-end (R$)</label>
            <input style={inputStyle} type="number" step="0.01" value={funnel.front_price || ''} onChange={e => update('front_price', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Order Bump 1 (R$)</label>
            <input style={inputStyle} type="number" step="0.01" value={funnel.bump1_price || ''} onChange={e => update('bump1_price', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Taxa Bump 1 (%)</label>
            <input style={inputStyle} type="number" step="0.01" min="0" max="1" value={funnel.bump1_rate || ''} onChange={e => update('bump1_rate', parseFloat(e.target.value) || 0)} placeholder="0.35 = 35%" />
          </div>
          <div>
            <label style={labelStyle}>Order Bump 2 (R$)</label>
            <input style={inputStyle} type="number" step="0.01" value={funnel.bump2_price || ''} onChange={e => update('bump2_price', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Taxa Bump 2 (%)</label>
            <input style={inputStyle} type="number" step="0.01" min="0" max="1" value={funnel.bump2_rate || ''} onChange={e => update('bump2_rate', parseFloat(e.target.value) || 0)} placeholder="0.25 = 25%" />
          </div>
          <div>
            <label style={labelStyle}>Upsell (R$)</label>
            <input style={inputStyle} type="number" step="0.01" value={funnel.upsell_price || ''} onChange={e => update('upsell_price', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Taxa Upsell (%)</label>
            <input style={inputStyle} type="number" step="0.01" min="0" max="1" value={funnel.upsell_rate || ''} onChange={e => update('upsell_rate', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Downsell (R$)</label>
            <input style={inputStyle} type="number" step="0.01" value={funnel.downsell_price || ''} onChange={e => update('downsell_price', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={labelStyle}>Taxa Downsell (%)</label>
            <input style={inputStyle} type="number" step="0.01" min="0" max="1" value={funnel.downsell_rate || ''} onChange={e => update('downsell_rate', parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        {/* EPV Display */}
        <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 12 : 24, flexDirection: isMobile ? 'column' : 'row' }}>
          <div>
            <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 500 }}>EPV Calculado</span>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#6366f1', fontFamily: "'Space Grotesk', sans-serif", margin: '4px 0 0' }}>{formatCurrency(epv)}</p>
          </div>
          <ArrowRight size={16} style={{ color: '#64748b' }} />
          <div>
            <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 500 }}>Predicted LTV (~3x)</span>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6', fontFamily: "'Space Grotesk', sans-serif", margin: '4px 0 0' }}>{formatCurrency(epv * 3)}</p>
          </div>
        </div>
      </div>

      {/* Connection */}
      <div style={glassCard}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>Conexão</h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Pixel ID</label>
            <input style={inputStyle} value={funnel.pixel_id || ''} onChange={e => update('pixel_id', e.target.value)} placeholder="Ex: 123456789012345" />
          </div>
          <div>
            <label style={labelStyle}>CAPI Token</label>
            <input style={inputStyle} type="password" value={funnel.capi_token_encrypted || ''} onChange={e => update('capi_token_encrypted', e.target.value)} placeholder="Token de acesso da CAPI" />
          </div>
          <div style={{ gridColumn: isMobile ? undefined : 'span 2' }}>
            <label style={labelStyle}>Gateway URL</label>
            <input style={inputStyle} value={funnel.gateway_url || `${SUPABASE_URL}/functions/v1/collect`} onChange={e => update('gateway_url', e.target.value)} placeholder="https://tracking.seudominio.com" />
          </div>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: '12px 32px', borderRadius: 12, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
            fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
            opacity: saving ? 0.6 : 1, transition: 'opacity 0.2s',
          }}
        >
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </button>
        {saveMsg && (
          <span style={{ fontSize: 13, color: saveMsg.startsWith('Erro') ? '#f87171' : '#4ade80', fontWeight: 500 }}>
            {saveMsg}
          </span>
        )}
      </div>
    </div>
  );
}

/* ============ SCRIPT TAB ============ */
function ScriptTab({ funnel, copied, onCopy }: {
  funnel: Partial<FunnelConfig>; copied: boolean;
  onCopy: () => void; isMobile: boolean;
}) {
  const gatewayUrl = funnel.gateway_url || `${SUPABASE_URL}/functions/v1/collect`;
  const script = generateTrackingScript(gatewayUrl, funnel.id || 'CONFIGURE_FUNNEL_FIRST');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!funnel.id && (
        <div style={{ ...glassCard, padding: 16, borderColor: 'rgba(250,204,21,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={18} style={{ color: '#facc15', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#facc15' }}>Configure e salve o funil primeiro para gerar o script com ID correto.</span>
        </div>
      )}

      {/* Script Preview */}
      <div style={glassCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
            Script de Tracking
          </h3>
          <button
            onClick={onCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)',
              background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(99,102,241,0.08)',
              color: copied ? '#4ade80' : '#a5b4fc',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado!' : 'Copiar Script'}
          </button>
        </div>
        <pre style={{
          background: 'rgba(15,23,42,0.04)', borderRadius: 12, padding: 16,
          overflow: 'auto', maxHeight: 300, fontSize: 11, lineHeight: 1.5,
          color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace",
          border: '1px solid rgba(15,23,42,0.08)',
        }}>
          {script}
        </pre>
      </div>

      {/* Usage Examples */}
      <div style={glassCard}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 16, fontFamily: "'Outfit', sans-serif" }}>Como Usar na LP</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <CodeExample title="Capturar Lead" code='AdsEdge.lead("email@ex.com", "11999998888", "Maria Santos");' />
          <CodeExample title="Iniciar Checkout" code='AdsEdge.initiateCheckout(37.00, "Produto X");' />
          <CodeExample title="Compra Aprovada" code='AdsEdge.purchase(62.98, "ORDER-123", "Produto X", ["prod-1"], 2, {&#10;  email: "cliente@email.com",&#10;  phone: "11999998888",&#10;  first_name: "Maria",&#10;  last_name: "Santos"&#10;});' />
          <CodeExample title="Evento Custom" code='AdsEdge.custom("ProtocolCompleted", { value: 0, currency: "BRL" });' />
        </div>
      </div>
    </div>
  );
}

function CodeExample({ title, code }: { title: string; code: string }) {
  return (
    <div>
      <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 500, marginBottom: 4, display: 'block' }}>{title}</span>
      <pre style={{
        background: 'rgba(15,23,42,0.04)', borderRadius: 8, padding: 12,
        fontSize: 12, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace",
        margin: 0, overflow: 'auto',
      }}>{code}</pre>
    </div>
  );
}

function getEmqColor(score: number): string {
  if (score >= 8) return '#4ade80';
  if (score >= 6) return '#facc15';
  return '#f87171';
}
