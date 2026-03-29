import { useState } from 'react';
import { SIGNAL_LEVELS, COLORS } from '../../utils/constants';
import { mockCAPIState, mockCAPIEvent, mockFunnelConfig } from '../../data/capiMockData';
import {
  Radio, Shield, Zap, Brain, Activity, ChevronRight, Copy, Check,
  Settings, Sparkles, Send,
} from 'lucide-react';
import EMQMonitorAdvanced from './EMQMonitorAdvanced';
import EventLogPanel from './EventLogPanel';
import ValueRulesPanel from './ValueRulesPanel';
import TrackingScriptPanel from './TrackingScriptPanel';
import FunnelBuilder from './FunnelBuilder';
import { useIsMobile } from '../../hooks/useMediaQuery';

const currentSignalLevel = 5;
const levelIcons = [Radio, Shield, Zap, Brain, Activity];

// ── Stat Cards ──
function StatCards() {
  const isMobile = useIsMobile();
  const stats = mockCAPIState.stats;
  const cards = [
    { label: 'EMQ (Qualidade)', value: stats.avg_emq.toFixed(1), sub: '/10', color: stats.avg_emq >= 8 ? COLORS.success : COLORS.warning },
    { label: 'Eventos', value: stats.events_24h.toLocaleString('pt-BR'), sub: '/24h', color: COLORS.accent },
    { label: 'Sintéticos', value: stats.synthetic_24h.toLocaleString('pt-BR'), sub: '/24h', color: COLORS.warning },
    { label: 'Correspondência', value: `${stats.match_rate}%`, sub: 'taxa', color: COLORS.info },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: isMobile ? 16 : 24 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: 'rgba(255, 255, 255, 0.34)',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: 20, padding: isMobile ? '12px 14px' : '18px 20px',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06), 0 12px 40px rgba(15,23,42,0.04)',
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20, width: 80, height: 80,
            background: `radial-gradient(circle, ${c.color}08, transparent)`,
          }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            {c.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>{c.value}</span>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>{c.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Signal Level Ladder (compact) ──
function SignalLadder() {
  const isMobile = useIsMobile();
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.34)',
      border: '1px solid rgba(15, 23, 42, 0.08)',
      borderRadius: 20, padding: isMobile ? 16 : 24, position: 'relative', overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06), 0 12px 40px rgba(15,23,42,0.04)',
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', width: 200, height: 200,
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, position: 'relative' }}>
        <Radio size={18} color={COLORS.accent} />
        <span style={{ color: COLORS.text, fontSize: 15, fontWeight: 700 }}>Nível de Sinal</span>
        <span style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
          border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: 6, padding: '3px 10px',
          fontSize: 12, fontWeight: 700, color: '#8b5cf6',
        }}>
          Level {currentSignalLevel}
        </span>
        <Sparkles size={14} color={COLORS.warning} style={{ marginLeft: -4 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 18, top: 18, width: 2,
          height: 'calc(100% - 36px)', background: 'rgba(15,23,42,0.04)', borderRadius: 1,
        }} />
        <div style={{
          position: 'absolute', left: 17, top: 18, width: 4,
          height: `${((currentSignalLevel) / SIGNAL_LEVELS.length) * 100}%`,
          background: `linear-gradient(180deg, ${COLORS.accent}, ${COLORS.accentLight})`,
          borderRadius: 2, boxShadow: `0 0 12px ${COLORS.accent}44`,
          transition: 'height 0.8s ease',
        }} />

        {SIGNAL_LEVELS.map((level, idx) => {
          const isActive = level.level === currentSignalLevel;
          const isPast = level.level < currentSignalLevel;
          const isFuture = level.level > currentSignalLevel;
          const Icon = levelIcons[idx] || Radio;

          return (
            <div key={level.level} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', position: 'relative',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive
                  ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})`
                  : isPast ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15,23,42,0.04)',
                border: isActive
                  ? `2px solid ${COLORS.accent}`
                  : isPast ? '2px solid rgba(99, 102, 241, 0.4)' : '2px solid rgba(15,23,42,0.08)',
                boxShadow: isActive ? `0 0 16px ${COLORS.accent}44` : 'none',
                transition: 'all 0.3s ease', zIndex: 2,
              }}>
                <Icon size={16} color={isActive ? '#fff' : isPast ? COLORS.accent : COLORS.textMuted} />
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isFuture ? COLORS.textMuted : COLORS.text }}>
                  {level.name}
                </span>
                <span style={{
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15,23,42,0.04)',
                  borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 600,
                  color: isActive ? COLORS.accent : COLORS.textMuted,
                }}>
                  {level.pct}
                </span>
              </div>

              {isActive && <ChevronRight size={14} color={COLORS.accent} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CAPI Payload Preview ──
function CAPIPayloadPreview() {
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const jsonString = JSON.stringify(mockCAPIEvent, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendEvent = () => {
    setSendStatus('sending');
    // Demo mode: simulate sending after 500ms
    setTimeout(() => {
      setSendStatus('sent');
      setTimeout(() => setSendStatus('idle'), 3000);
    }, 500);
  };

  const ud = mockCAPIEvent.user_data;
  const cd = mockCAPIEvent.custom_data;

  const userFields = [
    { label: 'em', present: !!ud.em?.length },
    { label: 'ph', present: !!ud.ph?.length },
    { label: 'external_id', present: !!ud.external_id?.length },
    { label: 'ip', present: !!ud.client_ip_address },
    { label: 'ua', present: !!ud.client_user_agent },
    { label: 'fbp', present: !!ud.fbp },
    { label: 'fbc', present: !!ud.fbc },
    { label: 'fn', present: !!ud.fn },
    { label: 'ln', present: !!ud.ln },
    { label: 'ct', present: !!ud.ct },
    { label: 'st', present: !!ud.st },
    { label: 'country', present: !!ud.country },
  ];

  const customFields = [
    { label: 'value', present: cd.value !== undefined },
    { label: 'predicted_ltv', present: cd.predicted_ltv !== undefined },
    { label: 'engagement', present: cd.engagement_score !== undefined },
    { label: 'buyer_score', present: cd.buyer_prediction_score !== undefined },
    { label: 'margin_tier', present: !!cd.margin_tier },
    { label: 'velocity', present: !!cd.funnel_velocity },
  ];

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.34)',
      border: '1px solid rgba(15, 23, 42, 0.08)',
      borderRadius: 20, padding: isMobile ? 16 : 24, display: 'flex', flexDirection: 'column', height: '100%',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06), 0 12px 40px rgba(15,23,42,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={16} color={COLORS.accent} />
          <span style={{ color: COLORS.text, fontSize: 14, fontWeight: 600 }}>CAPI Payload</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleSendEvent} disabled={sendStatus === 'sending'} style={{
            background: sendStatus === 'sent' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            border: `1px solid ${sendStatus === 'sent' ? 'rgba(74,222,128,0.3)' : 'rgba(99,102,241,0.3)'}`,
            borderRadius: 6, padding: '4px 10px',
            color: sendStatus === 'sent' ? COLORS.success : COLORS.accent,
            fontSize: 11, fontWeight: 500, cursor: sendStatus === 'sending' ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            opacity: sendStatus === 'sending' ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}>
            {sendStatus === 'sent' ? <Check size={12} /> : <Send size={12} />}
            {sendStatus === 'idle' ? 'Enviar Evento' : sendStatus === 'sending' ? 'Enviando...' : 'Evento enviado com sucesso!'}
          </button>
          <button onClick={handleCopy} style={{
            background: copied ? 'rgba(74, 222, 128, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(99,102,241,0.3)'}`,
            borderRadius: 6, padding: '4px 10px', color: copied ? COLORS.success : COLORS.accent,
            fontSize: 11, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copiado!' : 'JSON'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>user_data</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {userFields.map(f => (
            <span key={f.label} style={{
              background: f.present ? 'rgba(74, 222, 128, 0.08)' : 'rgba(248, 113, 113, 0.08)',
              border: `1px solid ${f.present ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
              borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 500,
              color: f.present ? COLORS.success : COLORS.danger,
            }}>
              {f.present ? '\u2713' : '\u2717'} {f.label}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>custom_data (level 5)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {customFields.map(f => (
            <span key={f.label} style={{
              background: f.present ? 'rgba(74, 222, 128, 0.08)' : 'rgba(248, 113, 113, 0.08)',
              border: `1px solid ${f.present ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
              borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 500,
              color: f.present ? COLORS.success : COLORS.danger,
            }}>
              {f.present ? '\u2713' : '\u2717'} {f.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{
        flex: 1, background: 'rgba(15, 23, 42, 0.04)', border: `1px solid ${COLORS.border}`,
        borderRadius: 10, overflow: 'auto', minHeight: 0,
      }}>
        <pre style={{
          margin: 0, padding: isMobile ? 10 : 14, fontSize: isMobile ? 9 : 10, lineHeight: 1.5,
          fontFamily: '"JetBrains Mono", "JetBrains Mono", monospace',
          color: COLORS.text, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          overflowX: 'auto',
        }}>{jsonString}</pre>
      </div>
    </div>
  );
}

// ── Funnel Flow Visualizer ──
function FunnelFlow() {
  const funnel = mockCAPIState.funnel;
  if (!funnel) return null;

  const stages = [
    { name: 'PageView', count: 1847, color: COLORS.textMuted },
    { name: 'Eng. Prof.', count: 342, color: COLORS.warning },
    { name: 'ViewContent', count: 289, color: COLORS.info },
    { name: 'Lead', count: 156, color: COLORS.accent },
    { name: 'Checkout', count: 89, color: COLORS.accentLight },
    { name: 'Compra', count: 26, color: COLORS.success },
  ];

  const maxCount = stages[0].count;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.34)',
      border: '1px solid rgba(15, 23, 42, 0.08)',
      borderRadius: 20, padding: 20, marginBottom: 20,
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06), 0 12px 40px rgba(15,23,42,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Funil Ativo:</span>
        <span style={{
          background: 'rgba(99, 102, 241, 0.12)', borderRadius: 6, padding: '2px 10px',
          fontSize: 12, fontWeight: 600, color: COLORS.accent,
        }}>
          {funnel.type.charAt(0).toUpperCase() + funnel.type.slice(1)}
        </span>
        <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' }}>
          LTV: <span style={{ color: COLORS.success, fontWeight: 600 }}>R$ {funnel.predicted_ltv.toFixed(2)}</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
        {stages.map((stage) => (
          <div key={stage.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: stage.color }}>{stage.count.toLocaleString('pt-BR')}</span>
            <div style={{
              width: '100%', borderRadius: 6,
              height: Math.max(8, (stage.count / maxCount) * 60),
              background: `linear-gradient(180deg, ${stage.color}44, ${stage.color}22)`,
              border: `1px solid ${stage.color}33`,
              transition: 'height 0.5s ease',
            }} />
            <span style={{ fontSize: 9, color: COLORS.textMuted, textAlign: 'center' }}>{stage.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Synthetic Events Summary ──
function SyntheticEventsSummary() {
  const isMobile = useIsMobile();
  const rules = mockCAPIState.syntheticRules.filter(r => r.enabled && r.fires_24h > 0);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.34)',
      border: '1px solid rgba(15, 23, 42, 0.08)',
      borderRadius: 20, padding: isMobile ? 16 : 24,
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06), 0 12px 40px rgba(15,23,42,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Zap size={18} color={COLORS.warning} />
        <span style={{ color: COLORS.text, fontSize: 15, fontWeight: 600 }}>Eventos Sintéticos</span>
        <span style={{
          background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600, color: COLORS.warning,
        }}>
          {mockCAPIState.syntheticRules.filter(r => r.enabled).length} ativos
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rules.map(rule => (
          <div key={rule.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
            background: 'rgba(15, 23, 42, 0.04)', borderRadius: 8,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: COLORS.success,
              boxShadow: `0 0 6px ${COLORS.success}`,
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, fontFamily: "'JetBrains Mono', 'JetBrains Mono', monospace", flex: 1 }}>
              {rule.event_name}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{rule.fires_24h}</span>
            <div style={{
              flex: 1, maxWidth: 100, height: 6, borderRadius: 3,
              background: 'rgba(15,23,42,0.04)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${rule.fire_rate}%`, borderRadius: 3,
                background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.warning}88)`,
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, minWidth: 30, textAlign: 'right' }}>
              {rule.fire_rate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main SignalEngine ──
type View = 'dashboard' | 'funnel-builder';

export default function SignalEngine() {
  const isMobile = useIsMobile();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [valueRules, setValueRules] = useState(mockCAPIState.valueRules);

  const toggleValueRule = (id: string) => {
    setValueRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  if (currentView === 'funnel-builder') {
    return (
      <FunnelBuilder
        config={mockFunnelConfig}
        onSave={() => setCurrentView('dashboard')}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ color: COLORS.text, fontSize: 24, fontWeight: 700, margin: 0 }}>Rastreamento de Sinal</h1>
            <span style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700, color: '#8b5cf6',
            }}>v5</span>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: '4px 0 0' }}>
            Centro de comando de sinais — maximize a qualidade de dados para o Andromeda
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setCurrentView('funnel-builder')}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(15,23,42,0.06)'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15,23,42,0.04)'; e.currentTarget.style.borderColor = COLORS.border; }}
            style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(15,23,42,0.06)', border: `1px solid ${COLORS.border}`,
            borderRadius: 10, padding: '8px 16px', color: COLORS.text, fontSize: 12,
            fontWeight: 500, cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            outline: 'none',
          }}>
            <Settings size={14} /> Configurar Funil
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <StatCards />

      {/* Funnel Flow */}
      <FunnelFlow />

      {/* Two-column: EMQ + CAPI Payload */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', gap: isMobile ? 16 : 20, marginBottom: isMobile ? 16 : 20 }}>
        <EMQMonitorAdvanced analysis={mockCAPIState.emqAnalysis!} />
        <CAPIPayloadPreview />
      </div>

      {/* Two-column: Signal Ladder + Synthetic Events */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 20, marginBottom: isMobile ? 16 : 20 }}>
        <SignalLadder />
        <SyntheticEventsSummary />
      </div>

      {/* Value Rules */}
      <div style={{ marginBottom: 20 }}>
        <ValueRulesPanel rules={valueRules} onToggle={toggleValueRule} />
      </div>

      {/* Event Log */}
      <div style={{ marginBottom: 20 }}>
        <EventLogPanel logs={mockCAPIState.eventLogs} />
      </div>

      {/* Tracking Script */}
      <TrackingScriptPanel config={mockFunnelConfig} rules={mockCAPIState.syntheticRules} />
    </div>
  );
}
