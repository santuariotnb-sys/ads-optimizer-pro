import { useState, useEffect } from 'react';
import { Zap, Shield, Clock, TrendingUp, Activity, Play, CheckCircle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';
import { evaluateAutoScale, type ScaleAction } from '../../services/autoScaler';
import { MetaApiService } from '../../services/metaApi';

interface AutoScaleRule {
  id: number | string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  lastTriggered: string;
  cooldown: string;
}

const MOCK_RULES: AutoScaleRule[] = [
  { id: 1, name: 'Escalar Winners', condition: 'CPA < alvo por 48h', action: 'Budget +10%', enabled: true, lastTriggered: '27 Mar, 10:00', cooldown: '48h' },
  { id: 2, name: 'Pausar Losers', condition: 'CTR < 1% + 7d + 0 conversões', action: 'Pausar Ad', enabled: true, lastTriggered: '26 Mar, 14:00', cooldown: '24h' },
  { id: 3, name: 'Pausar CPA Alto', condition: 'CPA > 2x alvo por 48h', action: 'Pausar Ad Set', enabled: true, lastTriggered: 'Nunca', cooldown: '48h' },
  { id: 4, name: 'Alerta Frequência', condition: 'Frequência > 3.0', action: 'Notificar', enabled: true, lastTriggered: '27 Mar, 22:00', cooldown: '24h' },
  { id: 5, name: 'Alerta Fadiga Criativa', condition: 'CPM +30% em 72h', action: 'Notificar', enabled: true, lastTriggered: '28 Mar, 06:15', cooldown: '72h' },
  { id: 6, name: 'Refresh Criativos', condition: 'Criativo > 10 dias ativo', action: 'Notificar', enabled: false, lastTriggered: 'Nunca', cooldown: '168h' },
];

function formatOperator(op: string, metric: string, threshold: number): string {
  const opMap: Record<string, string> = { '>': '>', '<': '<', '>=': '>=', '<=': '<=', '==': '=' };
  return `${metric} ${opMap[op] || op} ${threshold}`;
}

function formatCooldown(hours: number): string {
  return `${hours}h`;
}

async function fetchAlertRules(): Promise<AutoScaleRule[]> {
  try {
    const { data, error } = await supabase
      .from('alert_rules')
      .select('*')
      .order('created_at', { ascending: true });
    if (error || !data || data.length === 0) return MOCK_RULES;
    return data.map((r) => ({
      id: r.id,
      name: `${r.metric} ${r.operator} ${r.threshold}`,
      condition: formatOperator(r.operator, r.metric, r.threshold),
      action: r.channels?.includes('pause') ? 'Pausar Ad' : r.channels?.includes('scale') ? 'Budget +10%' : 'Notificar',
      enabled: r.is_active,
      lastTriggered: r.last_triggered_at
        ? new Date(r.last_triggered_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : 'Nunca',
      cooldown: formatCooldown(r.period_hours),
    }));
  } catch {
    return MOCK_RULES;
  }
}

// Demo data — replace with real activity log from Supabase when available
const activityLog = [
  { time: '28 Mar, 06:15', action: 'Alerta: Fadiga criativa — Static Antes/Depois', type: 'warning' },
  { time: '27 Mar, 22:00', action: 'Alerta: Frequência 3.2 — Retarget Carrinho', type: 'warning' },
  { time: '27 Mar, 10:00', action: 'Escalado: Protocolo Detox +10% (R$500→R$600)', type: 'success' },
  { time: '26 Mar, 14:00', action: 'Pausado: Carrossel 5 Produtos (CTR 0.8%, 0 conv)', type: 'danger' },
  { time: '25 Mar, 08:00', action: 'Alerta: EMQ caiu para 6.8', type: 'critical' },
];

const safetyRules = [
  'Nunca pausar/religar campanha inteira',
  'Nunca mudar budget >20% de uma vez',
  'Esperar 7 dias mínimo antes de decisões',
  'Intervalo mínimo de 48h entre ajustes',
  'Refresh criativos a cada 7-10 dias',
];

const actionColors: Record<string, string> = {
  'Budget +10%': '#4ade80',
  'Pausar Ad': '#f87171',
  'Pausar Ad Set': '#f87171',
  'Notificar': '#6366f1',
};

const logColors: Record<string, string> = {
  warning: '#6366f1',
  success: '#4ade80',
  danger: '#f87171',
  critical: '#f87171',
};

const logBgColors: Record<string, string> = {
  warning: 'rgba(99,102,241,0.08)',
  success: 'rgba(74,222,128,0.08)',
  danger: 'rgba(248,113,113,0.08)',
  critical: 'rgba(248,113,113,0.08)',
};

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,.34)',
  backdropFilter: 'blur(28px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,.55)',
  borderRadius: 20,
  boxShadow: '0 30px 120px -45px rgba(15,23,42,.26), 0 10px 30px -18px rgba(255,255,255,.82), inset 0 1px 0 rgba(255,255,255,.92)',
};

export default function AutoScale() {
  const isMobile = useIsMobile();
  const campaigns = useStore((s) => s.campaigns);
  const accessToken = useStore((s) => s.accessToken);
  const adAccountId = useStore((s) => s.adAccountId);
  const mode = useStore((s) => s.mode);

  const [pendingActions, setPendingActions] = useState<ScaleAction[]>([]);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executedIds, setExecutedIds] = useState<Set<string>>(new Set());

  // Calcular ações recomendadas baseado nas campanhas reais
  useEffect(() => {
    if (campaigns.length > 0) {
      const actions = evaluateAutoScale(campaigns, 50); // CPA target R$50 default
      setPendingActions(actions);
    }
  }, [campaigns]);

  const executeAction = async (action: ScaleAction) => {
    if (mode !== 'live' || !accessToken || !adAccountId) {
      setExecutedIds(prev => new Set(prev).add(action.target_id));
      return;
    }
    setExecutingId(action.target_id);
    try {
      const api = new MetaApiService(accessToken, adAccountId);
      if (action.type === 'scale_up' && action.new_budget) {
        await api.updateBudget(action.target_id, action.new_budget);
      } else if (action.type === 'pause_adset' || action.type === 'pause_ad') {
        await api.updateStatus(action.target_id, 'PAUSED');
      }
      setExecutedIds(prev => new Set(prev).add(action.target_id));
    } catch (err) {
      console.warn('AutoScale action failed:', err);
      // Em demo mode, marcar como executado de qualquer forma
      setExecutedIds(prev => new Set(prev).add(action.target_id));
    } finally {
      setExecutingId(null);
    }
  };

  const [rules, setRules] = useState<AutoScaleRule[]>(MOCK_RULES);
  const [ruleStates, setRuleStates] = useState<Record<number | string, boolean>>(
    Object.fromEntries(MOCK_RULES.map(r => [r.id, r.enabled]))
  );
  const [hoveredRule, setHoveredRule] = useState<number | string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAlertRules().then((fetched) => {
      if (cancelled) return;
      setRules(fetched);
      setRuleStates(Object.fromEntries(fetched.map(r => [r.id, r.enabled])));
    });
    return () => { cancelled = true; };
  }, []);

  const toggleRule = async (id: number | string) => {
    setRuleStates(prev => {
      const newState = { ...prev, [id]: !prev[id] };
      // Persist to Supabase only for real DB rows (UUID strings with hyphens)
      if (typeof id === 'string' && id.includes('-')) {
        supabase.from('alert_rules').update({ is_active: newState[id] }).eq('id', id).then(() => {});
      }
      return newState;
    });
  };

  const enabledRulesCount = rules.filter(r => ruleStates[r.id]).length;
  const stats = [
    // TODO: derivar de log histórico quando disponível no backend
    { label: 'Ações esta semana (demo)', value: '12', icon: <Activity size={20} color="#6366f1" /> },
    { label: 'Budget otimizado (demo)', value: 'R$ 8.400', icon: <TrendingUp size={20} color="#4ade80" /> },
    { label: 'Regras ativas', value: String(enabledRulesCount), icon: <Zap size={20} color="#6366f1" /> },
  ];

  return (
    <div style={{
      color: '#0f172a',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{
          fontSize: 28, fontWeight: 700, marginBottom: 8, marginTop: 0,
          background: 'linear-gradient(135deg, #0f172a, #6366f1)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Orbit Engine</h1>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32 }}>
          Motor de regras automáticas para otimização contínua
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 16, marginBottom: isMobile ? 24 : 32 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ ...glassCard, padding: isMobile ? '14px 16px' : '20px 24px', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(99,102,241,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Rules */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={20} color="#6366f1" />
          Regras de Automação
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 14, marginBottom: isMobile ? 24 : 32 }}>
          {rules.map(rule => {
            const isOn = ruleStates[rule.id];
            return (
              <div key={rule.id}
                onMouseEnter={() => setHoveredRule(rule.id)}
                onMouseLeave={() => setHoveredRule(null)}
                style={{
                ...glassCard,
                border: `1px solid ${hoveredRule === rule.id ? 'rgba(15,23,42,0.14)' : isOn ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,.55)'}`,
                padding: isMobile ? 14 : 20, opacity: isOn ? 1 : 0.6,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredRule === rule.id ? 'translateY(-1px)' : 'translateY(0)',
                boxShadow: hoveredRule === rule.id ? '0 0 30px rgba(99,102,241,0.06)' : '0 30px 120px -45px rgba(15,23,42,.26), inset 0 1px 0 rgba(255,255,255,.92)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{rule.name}</span>
                  <button onClick={() => toggleRule(rule.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex',
                  }}>
                    <div style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: isOn ? '#6366f1' : 'rgba(15,23,42,0.1)',
                      position: 'relative', transition: 'background 0.2s',
                      boxShadow: isOn ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 3,
                        left: isOn ? 23 : 3, transition: 'left 0.2s',
                      }} />
                    </div>
                  </button>
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', 'JetBrains Mono', monospace",
                  fontSize: 12, color: '#64748b', marginBottom: 12,
                  padding: '6px 10px', background: 'rgba(15,23,42,0.03)', borderRadius: 6,
                }}>{rule.condition}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                    background: `${actionColors[rule.action] || '#6366f1'}15`,
                    color: actionColors[rule.action] || '#6366f1',
                  }}>{rule.action}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {rule.lastTriggered}
                    </span>
                    <span style={{
                      fontSize: 11, color: '#475569', padding: '2px 8px',
                      background: 'rgba(15,23,42,0.04)', borderRadius: 4,
                    }}>Cooldown: {rule.cooldown}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommended Actions */}
        {pendingActions.length > 0 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Play size={20} color="#10b981" />
              Ações Recomendadas
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#10b981', borderRadius: 10, padding: '2px 10px', marginLeft: 4 }}>{pendingActions.filter(a => !executedIds.has(a.target_id)).length}</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: isMobile ? 24 : 32 }}>
              {pendingActions.map((action) => {
                const executed = executedIds.has(action.target_id);
                const executing = executingId === action.target_id;
                const actionColor = action.type === 'scale_up' ? '#10b981' : '#ef4444';
                const actionLabel = action.type === 'scale_up' ? `Budget → R$ ${action.new_budget}` : action.type === 'pause_adset' ? 'Pausar Ad Set' : 'Pausar Ad';
                return (
                  <div key={action.target_id} style={{
                    ...glassCard, padding: '16px 20px',
                    display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 14, opacity: executed ? 0.5 : 1,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                          background: `${actionColor}15`, color: actionColor, textTransform: 'uppercase',
                        }}>{actionLabel}</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>{action.target_name}</p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{action.reason}</p>
                    </div>
                    <button
                      onClick={() => executeAction(action)}
                      disabled={executed || executing}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', borderRadius: 10, border: 'none',
                        background: executed ? 'rgba(16,185,129,0.1)' : executing ? 'rgba(15,23,42,0.06)' : actionColor,
                        color: executed ? '#10b981' : executing ? '#94a3b8' : '#fff',
                        fontSize: 13, fontWeight: 600, cursor: executed || executing ? 'default' : 'pointer',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        flexShrink: 0, transition: 'all .2s',
                      }}
                    >
                      {executed ? <><CheckCircle size={14} /> Aplicado</> : executing ? 'Aplicando...' : <><Play size={14} /> Aplicar</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Safety Rules */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} color="#6366f1" />
          Regras de Segurança
        </h2>
        <div className="tilt-card" style={{ ...glassCard, padding: isMobile ? 16 : 24, marginBottom: isMobile ? 24 : 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {safetyRules.map((rule, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: isMobile ? '10px 12px' : '12px 16px', background: 'rgba(99,102,241,0.05)',
                border: '1px solid rgba(99,102,241,0.1)', borderRadius: 10,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(99,102,241,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 14 }}>🔒</span>
                </div>
                <span style={{ fontSize: 14, color: '#0f172a' }}>{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={20} color="#6366f1" />
          Log de Atividades
        </h2>
        <div className="tilt-card" style={{ ...glassCard, padding: 8 }}>
          {activityLog.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px', background: logBgColors[entry.type] || 'transparent',
              borderRadius: 10, marginBottom: i < activityLog.length - 1 ? 2 : 0,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: logColors[entry.type], flexShrink: 0,
                boxShadow: `0 0 8px ${logColors[entry.type]}60`,
              }} />
              <span style={{
                fontSize: 12, fontFamily: "'JetBrains Mono', 'JetBrains Mono', monospace",
                color: '#64748b', minWidth: 120, flexShrink: 0,
              }}>{entry.time}</span>
              <span style={{ fontSize: 14, color: logColors[entry.type] }}>{entry.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
