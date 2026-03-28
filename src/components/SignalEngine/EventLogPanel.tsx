import { useState } from 'react';
import type { CAPIEventLog } from '../../types/capi';
import { FileText, CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';
import { COLORS } from '../../utils/constants';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface Props {
  logs: CAPIEventLog[];
}

export default function EventLogPanel({ logs }: Props) {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<'all' | 'synthetic' | 'failed'>('all');

  const filtered = logs.filter(log => {
    if (filter === 'synthetic') return log.is_synthetic;
    if (filter === 'failed') return log.status === 'failed';
    return true;
  });

  const statusIcon = (status: CAPIEventLog['status']) => {
    switch (status) {
      case 'sent': return <CheckCircle size={12} color={COLORS.success} />;
      case 'failed': return <XCircle size={12} color={COLORS.danger} />;
      case 'retrying': return <RefreshCw size={12} color={COLORS.warning} />;
    }
  };

  const statusColor = (status: CAPIEventLog['status']) => {
    switch (status) {
      case 'sent': return COLORS.success;
      case 'failed': return COLORS.danger;
      case 'retrying': return COLORS.warning;
    }
  };

  const emqColor = (score: number) => {
    if (score >= 8) return COLORS.success;
    if (score >= 6) return COLORS.warning;
    return COLORS.danger;
  };

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
    border: `1px solid ${active ? 'rgba(16, 185, 129, 0.3)' : COLORS.border}`,
    borderRadius: 6, padding: isMobile ? '8px 12px' : '4px 10px', fontSize: isMobile ? 12 : 11, fontWeight: 500,
    color: active ? COLORS.accent : COLORS.textMuted, cursor: 'pointer',
    minHeight: isMobile ? 36 : undefined,
  });

  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderRadius: 16, padding: isMobile ? 14 : 24,
    }}>
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 16, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={18} color={COLORS.accent} />
          <span style={{ color: COLORS.text, fontSize: 15, fontWeight: 600 }}>Event Log</span>
          <span style={{
            background: 'rgba(16, 185, 129, 0.12)', borderRadius: 6, padding: '2px 8px',
            fontSize: 11, fontWeight: 600, color: COLORS.accent,
          }}>{filtered.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as never }}>
          <button onClick={() => setFilter('all')} style={filterBtnStyle(filter === 'all')}>Todos</button>
          <button onClick={() => setFilter('synthetic')} style={filterBtnStyle(filter === 'synthetic')}>Sintéticos</button>
          <button onClick={() => setFilter('failed')} style={filterBtnStyle(filter === 'failed')}>Falhas</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
        {filtered.map(log => (
          <div key={log.id} style={{
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 8 : 10, padding: isMobile ? '10px 10px' : '10px 14px',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            background: log.status === 'failed' ? 'rgba(248, 113, 113, 0.04)' : 'rgba(12, 12, 20, 0.4)',
            border: `1px solid ${log.status === 'failed' ? 'rgba(248, 113, 113, 0.12)' : COLORS.border}`,
            borderRadius: 10,
          }}>
            {statusIcon(log.status)}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: COLORS.text,
                  fontFamily: '"Fira Code", monospace',
                }}>{log.event_name}</span>
                {log.is_synthetic && <Zap size={10} color={COLORS.warning} />}
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>
                {new Date(log.timestamp).toLocaleTimeString('pt-BR')} · {log.user_data_fields.length} user fields · {log.custom_data_fields.length} custom fields
              </div>
            </div>

            {!isMobile && log.value !== undefined && (
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.success, fontFamily: 'monospace' }}>
                R$ {log.value.toFixed(2)}
              </span>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: `${emqColor(log.emq_contribution)}11`,
              border: `1px solid ${emqColor(log.emq_contribution)}22`,
              borderRadius: 6, padding: '2px 8px',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: emqColor(log.emq_contribution) }}>
                EMQ {log.emq_contribution.toFixed(1)}
              </span>
            </div>

            {!isMobile && (
              <span style={{
                fontSize: 10, fontWeight: 500, color: statusColor(log.status),
                minWidth: 36, textAlign: 'right',
              }}>
                {log.response_code || '—'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
