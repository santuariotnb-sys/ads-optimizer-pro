import { useState } from 'react';
import { mockAlerts } from '../../data/mockData';
import { formatDate, getSeverityColor } from '../../utils/formatters';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X, Bell, PartyPopper } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';

type TabKey = 'all' | 'critical' | 'warning' | 'info' | 'success';

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,.34)',
  backdropFilter: 'blur(28px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,.55)',
  borderRadius: 20,
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 30px 120px -45px rgba(15,23,42,.26), 0 10px 30px -18px rgba(255,255,255,.82), inset 0 1px 0 rgba(255,255,255,.92)',
};

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'critical', label: 'Criticos' },
  { key: 'warning', label: 'Avisos' },
  { key: 'info', label: 'Info' },
  { key: 'success', label: 'Sucesso' },
];

function SeverityIcon({ severity }: { severity: string }) {
  const color = getSeverityColor(severity);
  const size = 18;
  switch (severity) {
    case 'critical': return <AlertTriangle size={size} color={color} />;
    case 'warning': return <AlertCircle size={size} color={color} />;
    case 'info': return <Info size={size} color={color} />;
    case 'success': return <CheckCircle size={size} color={color} />;
    default: return <Info size={size} color={color} />;
  }
}

export default function Alerts() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [localAlerts, setLocalAlerts] = useState(mockAlerts);
  const dismissAlert = useStore((s) => s.dismissAlert);

  const counts: Record<TabKey, number> = {
    all: localAlerts.filter(a => !a.dismissed).length,
    critical: localAlerts.filter(a => a.severity === 'critical' && !a.dismissed).length,
    warning: localAlerts.filter(a => a.severity === 'warning' && !a.dismissed).length,
    info: localAlerts.filter(a => a.severity === 'info' && !a.dismissed).length,
    success: localAlerts.filter(a => a.severity === 'success' && !a.dismissed).length,
  };

  const filtered = localAlerts.filter(a => activeTab === 'all' || a.severity === activeTab);

  const handleDismiss = (id: string) => {
    setLocalAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
    dismissAlert(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99,102,241,0.3)',
        }}>
          <Bell size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            Central de Alertas
          </h2>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            {counts.all} alertas pendentes
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch', paddingBottom: isMobile ? 4 : 0 }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.key];
          const severityColor = tab.key !== 'all' ? getSeverityColor(tab.key) : '#6366f1';

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', outline: 'none',
                fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap',
                background: isActive ? `${severityColor}20` : 'rgba(15,23,42,0.04)',
                color: isActive ? severityColor : '#64748b',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {tab.label}
              {count > 0 && (
                <span style={{
                  background: severityColor, color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                  minWidth: 18, textAlign: 'center',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alert Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((alert) => {
          const color = getSeverityColor(alert.severity);
          return (
            <div
              key={alert.id}
              role={alert.severity === 'critical' || alert.severity === 'warning' ? 'alert' : undefined}
              style={{
                ...glassCard,
                padding: isMobile ? 12 : 16,
                borderLeft: `3px solid ${color}`,
                opacity: alert.dismissed ? 0.4 : 1,
                display: 'flex', alignItems: 'flex-start', gap: isMobile ? 10 : 14,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SeverityIcon severity={alert.severity} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                    {alert.title}
                  </span>
                  {alert.campaign_id && (
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 8,
                      background: 'rgba(99,102,241,0.15)', color: '#8b5cf6',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {alert.campaign_id}
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                  {alert.message}
                </p>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {formatDate(alert.timestamp)}
                </span>
              </div>

              {/* Dismiss */}
              {!alert.dismissed && (
                <button
                  onClick={() => handleDismiss(alert.id)}
                  aria-label="Dispensar alerta"
                  style={{
                    background: 'rgba(15,23,42,0.04)', border: 'none', cursor: 'pointer',
                    borderRadius: 8, padding: 6, flexShrink: 0,
                    color: '#64748b', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: isMobile ? 44 : undefined, minHeight: isMobile ? 44 : undefined,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = 'rgba(15,23,42,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(15,23,42,0.04)'; }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="tilt-card" style={glassCard}>
            <EmptyState
              icon={counts.all === 0 ? PartyPopper : CheckCircle}
              title={counts.all === 0 ? 'Tudo certo!' : 'Nenhum alerta nesta categoria'}
              description={counts.all === 0
                ? 'Seus alertas aparecerão aqui quando houver algo para otimizar.'
                : 'Troque de aba para ver outros alertas.'}
            />
          </div>
        )}
      </div>
    </div>
  );
}
