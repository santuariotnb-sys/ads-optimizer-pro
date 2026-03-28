import { useState } from 'react';
import { Zap, Shield, Clock, TrendingUp, Activity } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

const rules = [
  { id: 1, name: 'Escalar Winners', condition: 'CPA < alvo por 48h', action: 'Budget +20%', enabled: true, lastTriggered: '27 Mar, 10:00', cooldown: '48h' },
  { id: 2, name: 'Pausar Losers', condition: 'CTR < 1% + 7d + 0 conversões', action: 'Pausar Ad', enabled: true, lastTriggered: '26 Mar, 14:00', cooldown: '24h' },
  { id: 3, name: 'Pausar CPA Alto', condition: 'CPA > 2x alvo por 48h', action: 'Pausar Ad Set', enabled: true, lastTriggered: 'Nunca', cooldown: '48h' },
  { id: 4, name: 'Alerta Frequência', condition: 'Frequência > 3.0', action: 'Notificar', enabled: true, lastTriggered: '27 Mar, 22:00', cooldown: '24h' },
  { id: 5, name: 'Alerta Fadiga Criativa', condition: 'CPM +30% em 72h', action: 'Notificar', enabled: true, lastTriggered: '28 Mar, 06:15', cooldown: '72h' },
  { id: 6, name: 'Refresh Criativos', condition: 'Criativo > 10 dias ativo', action: 'Notificar', enabled: false, lastTriggered: 'Nunca', cooldown: '168h' },
];

const activityLog = [
  { time: '28 Mar, 06:15', action: 'Alerta: Fadiga criativa — Static Antes/Depois', type: 'warning' },
  { time: '27 Mar, 22:00', action: 'Alerta: Frequência 3.2 — Retarget Carrinho', type: 'warning' },
  { time: '27 Mar, 10:00', action: 'Escalado: Protocolo Detox +20% (R$500→R$600)', type: 'success' },
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
  'Budget +20%': '#4ade80',
  'Pausar Ad': '#f87171',
  'Pausar Ad Set': '#f87171',
  'Notificar': '#f59e0b',
};

const logColors: Record<string, string> = {
  warning: '#f59e0b',
  success: '#4ade80',
  danger: '#f87171',
  critical: '#ef4444',
};

const logBgColors: Record<string, string> = {
  warning: 'rgba(245,158,11,0.08)',
  success: 'rgba(74,222,128,0.08)',
  danger: 'rgba(248,113,113,0.08)',
  critical: 'rgba(239,68,68,0.08)',
};

const glassCard: React.CSSProperties = {
  background: 'rgba(22,22,32,0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
};

export default function AutoScale() {
  const isMobile = useIsMobile();
  const [ruleStates, setRuleStates] = useState<Record<number, boolean>>(
    Object.fromEntries(rules.map(r => [r.id, r.enabled]))
  );

  const toggleRule = (id: number) => {
    setRuleStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const stats = [
    { label: 'Ações esta semana', value: '12', icon: <Activity size={20} color="#6366f1" /> },
    { label: 'Budget otimizado', value: 'R$ 8.400', icon: <TrendingUp size={20} color="#4ade80" /> },
    { label: 'Campanhas afetadas', value: '4', icon: <Zap size={20} color="#f59e0b" /> },
  ];

  return (
    <div style={{
      background: '#0c0c14', minHeight: '100vh', padding: isMobile ? 16 : 32,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#e2e8f0',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{
          fontSize: 28, fontWeight: 700, marginBottom: 8, marginTop: 0,
          background: 'linear-gradient(135deg, #e2e8f0, #6366f1)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Auto-Scale</h1>
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
                <div style={{ fontSize: 24, fontWeight: 700 }}>{stat.value}</div>
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
              <div key={rule.id} style={{
                ...glassCard,
                border: `1px solid ${isOn ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)'}`,
                padding: isMobile ? 14 : 20, opacity: isOn ? 1 : 0.6, transition: 'all 0.3s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{rule.name}</span>
                  <button onClick={() => toggleRule(rule.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex',
                  }}>
                    <div style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: isOn ? '#6366f1' : 'rgba(255,255,255,0.1)',
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
                  fontFamily: '"SF Mono", "Fira Code", monospace',
                  fontSize: 12, color: '#64748b', marginBottom: 12,
                  padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6,
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
                      background: 'rgba(255,255,255,0.04)', borderRadius: 4,
                    }}>Cooldown: {rule.cooldown}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safety Rules */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} color="#f59e0b" />
          Regras de Segurança
        </h2>
        <div style={{ ...glassCard, padding: isMobile ? 16 : 24, marginBottom: isMobile ? 24 : 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {safetyRules.map((rule, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: isMobile ? '10px 12px' : '12px 16px', background: 'rgba(245,158,11,0.05)',
                border: '1px solid rgba(245,158,11,0.1)', borderRadius: 10,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(245,158,11,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 14 }}>🔒</span>
                </div>
                <span style={{ fontSize: 14, color: '#e2e8f0' }}>{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={20} color="#6366f1" />
          Log de Atividades
        </h2>
        <div style={{ ...glassCard, padding: 8 }}>
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
                fontSize: 12, fontFamily: '"SF Mono", "Fira Code", monospace',
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
