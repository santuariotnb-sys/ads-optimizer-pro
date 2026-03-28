import { useState } from 'react';
import type { FunnelConfig, FunnelType, FunnelValues } from '../../types/capi';
import { calculatePredictedLTV, calculateEPV } from '../../services/capi/enrichment';
import { Settings, Package, Briefcase, Monitor, Users, Wrench, Save, Wifi, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { COLORS } from '../../utils/constants';
import { useIsMobile } from '../../hooks/useMediaQuery';

const FUNNEL_TEMPLATES: { type: FunnelType; label: string; icon: typeof Package; desc: string }[] = [
  { type: 'infoproduto', label: 'Infoproduto', icon: Package, desc: 'VSL → Checkout → Bumps → Upsell' },
  { type: 'dropshipping', label: 'Dropshipping', icon: Briefcase, desc: 'Catálogo → Produto → Cart → Checkout' },
  { type: 'saas', label: 'SaaS', icon: Monitor, desc: 'Landing → Trial → Ativação → Pagamento' },
  { type: 'leadgen', label: 'Lead Gen', icon: Users, desc: 'LP → Formulário → Qualificação → Venda' },
  { type: 'custom', label: 'Custom', icon: Wrench, desc: 'Configure tudo manualmente' },
];

interface Props {
  config: FunnelConfig;
  onSave: (config: FunnelConfig) => void;
  onTestConnection: () => void;
  onBack: () => void;
}

export default function FunnelBuilder({ config, onSave, onTestConnection, onBack }: Props) {
  const isMobile = useIsMobile();
  const [funnel, setFunnel] = useState<FunnelConfig>(config);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enabledEvents, setEnabledEvents] = useState<Set<string>>(
    new Set(config.events.filter(e => e.enabled).map(e => e.id))
  );

  const updateValues = (partial: Partial<FunnelValues>) => {
    const newValues = { ...funnel.values, ...partial };
    const ltv = calculatePredictedLTV(newValues);
    const epv = calculateEPV(newValues);
    setFunnel(f => ({ ...f, values: newValues, predicted_ltv: ltv, epv }));
  };

  const toggleEvent = (id: string) => {
    setEnabledEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleSave = () => {
    onSave({
      ...funnel,
      events: funnel.events.map(e => ({ ...e, enabled: enabledEvents.has(e.id) })),
      updated_at: new Date().toISOString(),
    });
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(12, 12, 20, 0.6)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: '8px 12px',
    color: COLORS.text,
    fontSize: 13,
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.textMuted,
    marginBottom: 4,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={20} color={COLORS.accent} />
          <span style={{ color: COLORS.text, fontSize: 18, fontWeight: 700 }}>Configurar Funil</span>
        </div>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: '6px 14px', color: COLORS.textMuted, fontSize: 12,
          cursor: 'pointer',
        }}>
          Voltar ao Dashboard
        </button>
      </div>

      {/* Funnel Type Selection */}
      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, padding: 24, marginBottom: 20,
      }}>
        <div style={labelStyle}>Tipo de Negócio</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: 10, marginTop: 8 }}>
          {FUNNEL_TEMPLATES.map(t => {
            const Icon = t.icon;
            const isActive = funnel.type === t.type;
            return (
              <button key={t.type} onClick={() => setFunnel(f => ({ ...f, type: t.type }))} style={{
                background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(12, 12, 20, 0.5)',
                border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.4)' : COLORS.border}`,
                borderRadius: 12, padding: '14px 10px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                transition: 'all 0.2s ease',
              }}>
                <Icon size={20} color={isActive ? COLORS.accent : COLORS.textMuted} />
                <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? COLORS.text : COLORS.textMuted }}>{t.label}</span>
                <span style={{ fontSize: 9, color: COLORS.textMuted, textAlign: 'center', lineHeight: 1.3 }}>{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Funnel Values */}
      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, padding: 24, marginBottom: 20,
      }}>
        <div style={labelStyle}>Valores do Funil</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 80px' : '1fr 1fr 80px', gap: 12, marginTop: 12 }}>
          {/* Front-end */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Front-end (R$)</label>
            <input type="number" value={funnel.values.front_end} style={inputStyle}
              onChange={e => updateValues({ front_end: Number(e.target.value) })} />
          </div>
          {/* Bumps */}
          {[
            { label: 'Order Bump 1', vKey: 'bump1_value', rKey: 'bump1_rate' },
            { label: 'Order Bump 2', vKey: 'bump2_value', rKey: 'bump2_rate' },
            { label: 'Upsell', vKey: 'upsell_value', rKey: 'upsell_rate' },
            { label: 'Downsell', vKey: 'downsell_value', rKey: 'downsell_rate' },
          ].map(item => (
            <div key={item.vKey} style={{ display: 'contents' }}>
              <div>
                <label style={labelStyle}>{item.label} (R$)</label>
                <input type="number" value={funnel.values[item.vKey as keyof FunnelValues]} style={inputStyle}
                  onChange={e => updateValues({ [item.vKey]: Number(e.target.value) })} />
              </div>
              <div>
                <label style={labelStyle}>Taxa (%)</label>
                <input type="number" value={funnel.values[item.rKey as keyof FunnelValues]} style={inputStyle}
                  onChange={e => updateValues({ [item.rKey]: Number(e.target.value) })} />
              </div>
              <div />
            </div>
          ))}
        </div>

        {/* Calculated Values */}
        <div style={{
          display: 'flex', gap: isMobile ? 12 : 20, marginTop: 20, padding: isMobile ? '12px 14px' : '16px 20px',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
          background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: 10,
        }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>EPV Calculado</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.accent }}>
              R$ {funnel.epv.toFixed(2)}
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(16, 185, 129, 0.15)' }} />
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>Predicted LTV</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.success }}>
              R$ {funnel.predicted_ltv.toFixed(2)}
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(16, 185, 129, 0.15)' }} />
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>Eventos Ativos</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.warning }}>
              {enabledEvents.size}
            </div>
          </div>
        </div>
      </div>

      {/* Pixel & Token */}
      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, padding: 24, marginBottom: 20,
      }}>
        <div style={labelStyle}>Configuração CAPI</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <label style={labelStyle}>Pixel ID</label>
            <input type="text" value={funnel.pixel_id} placeholder="Ex: 123456789012345" style={inputStyle}
              onChange={e => setFunnel(f => ({ ...f, pixel_id: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Access Token</label>
            <input type="password" value={funnel.access_token} placeholder="EAAG..." style={inputStyle}
              onChange={e => setFunnel(f => ({ ...f, access_token: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: COLORS.textMuted }}>
          CAPI Endpoint: <span style={{ color: COLORS.text, fontFamily: 'monospace' }}>graph.facebook.com/{funnel.pixel_id || '...'}/events</span>
        </div>
      </div>

      {/* Events Toggle */}
      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, padding: 24, marginBottom: 20,
      }}>
        <button onClick={() => setShowAdvanced(!showAdvanced)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>
          <span style={labelStyle}>Eventos do Funil</span>
          {showAdvanced ? <ChevronUp size={16} color={COLORS.textMuted} /> : <ChevronDown size={16} color={COLORS.textMuted} />}
        </button>

        {showAdvanced && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {funnel.events.map(evt => (
              <label key={evt.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                background: enabledEvents.has(evt.id) ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${enabledEvents.has(evt.id) ? 'rgba(16, 185, 129, 0.15)' : 'transparent'}`,
              }}>
                <input type="checkbox" checked={enabledEvents.has(evt.id)}
                  onChange={() => toggleEvent(evt.id)}
                  style={{ accentColor: COLORS.accent }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{evt.display_name}</span>
                    {evt.is_synthetic && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                        background: 'rgba(52, 211, 153, 0.12)', color: COLORS.warning,
                        border: '1px solid rgba(52, 211, 153, 0.2)',
                      }}>SINTÉTICO</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{evt.description}</span>
                </div>
                {evt.default_value && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.success, fontFamily: 'monospace' }}>
                    R$ {evt.default_value.toFixed(2)}
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: isMobile ? 'stretch' : 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
        <button onClick={onTestConnection} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`,
          borderRadius: 10, padding: '10px 20px', color: COLORS.text, fontSize: 13,
          fontWeight: 500, cursor: 'pointer',
        }}>
          <Wifi size={14} /> Testar Conexão
        </button>
        <button onClick={() => {}} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`,
          borderRadius: 10, padding: '10px 20px', color: COLORS.text, fontSize: 13,
          fontWeight: 500, cursor: 'pointer',
        }}>
          <Eye size={14} /> Preview JSON
        </button>
        <button onClick={handleSave} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})`,
          border: 'none', borderRadius: 10, padding: '10px 24px',
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          boxShadow: `0 0 20px ${COLORS.accent}33`,
        }}>
          <Save size={14} /> Salvar Funil
        </button>
      </div>
    </div>
  );
}
