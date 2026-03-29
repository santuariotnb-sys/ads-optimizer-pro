import React from 'react';
import { motion } from 'motion/react';
import MetricCard from './MetricCard';
import AccountScore from './AccountScore';
import { mockMetricCards, mockCampaigns, mockDashboardMetrics } from '../../data/mockData';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { formatCurrency, getStatusColor, getScoreColor } from '../../utils/formatters';

const INVERT_LABELS = ['CPA', 'CPM'];

const statusLabel: Record<string, string> = {
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  LEARNING: 'Aprendizado',
  LEARNING_LIMITED: 'Aprendizado Limitado',
};

const Dashboard: React.FC = () => {
  const selectedPeriod = useStore((s) => s.selectedPeriod);
  const isMobile = useIsMobile();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h1
            style={{
              fontSize: isMobile ? 22 : 28,
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              color: '#0f172a',
              margin: 0,
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Visao geral da performance das campanhas
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: 'rgba(15, 23, 42, 0.04)',
            borderRadius: 10,
            padding: 3,
            border: '1px solid rgba(15, 23, 42, 0.08)',
          }}
        >
          {(['today', '7d', '14d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => useStore.getState().setSelectedPeriod(p)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedPeriod === p ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: selectedPeriod === p ? '#8b5cf6' : '#a3a3a3',
              }}
            >
              {p === 'today' ? 'Hoje' : p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Metric Cards Grid + Account Score */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 220px', gap: 24, alignItems: 'start' }}>
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? 10 : 16,
          }}
        >
          {mockMetricCards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              change={card.change}
              sparkline={card.sparkline}
              invertChange={INVERT_LABELS.includes(card.label)}
            />
          ))}
        </motion.div>
        <AccountScore score={mockDashboardMetrics.accountScore} />
      </div>

      {/* Campaigns Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
        style={{
          background: 'rgba(255, 255, 255, 0.34)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.55)',
          borderTop: '1px solid rgba(255, 255, 255, 0.7)',
          borderRadius: 20,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06), 0 12px 40px rgba(15,23,42,0.04)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Shimmer overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
          borderRadius: '20px 20px 0 0',
          pointerEvents: 'none',
        }} />

        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              color: '#0f172a',
              margin: 0,
            }}
          >
            Campanhas
          </h2>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#a3a3a3' }}>
            {mockCampaigns.length} campanhas
          </span>
        </div>

        <div style={{ overflowX: 'auto', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' as never }}>
          <table role="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr role="row">
                {['Nome', 'Status', 'Gasto', 'ROAS', 'CPA', 'CTR', 'Frequencia', 'Score']
                  .filter((h) => !(isMobile && ['Frequencia', 'CPM', 'CTR'].includes(h)))
                  .map((h) => (
                  <th
                    key={h}
                    role="columnheader"
                    style={{
                      padding: isMobile ? '10px 10px' : '12px 16px',
                      fontSize: isMobile ? 10 : 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#64748b',
                      background: 'rgba(248, 248, 246, 0.8)',
                      textAlign: h === 'Nome' ? 'left' : 'right',
                      borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockCampaigns.map((campaign) => {
                const statusColor = getStatusColor(campaign.status);
                const scoreColor = getScoreColor(campaign.opportunity_score);
                return (
                  <tr
                    key={campaign.id}
                    role="row"
                    style={{
                      transition: 'background 0.2s, border-color 0.2s',
                      cursor: 'pointer',
                      borderLeft: '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.04)';
                      e.currentTarget.style.borderLeft = '3px solid #6366f1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderLeft = '3px solid transparent';
                    }}
                  >
                    <td
                      role="cell"
                      style={{
                        padding: isMobile ? '10px 10px' : '14px 16px',
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: 500,
                        color: '#0f172a',
                        borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
                        maxWidth: isMobile ? 160 : 280,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {campaign.name}
                    </td>
                    <td
                      role="cell"
                      style={{
                        padding: '14px 16px',
                        textAlign: 'right',
                        borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          color: statusColor,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: `${statusColor}15`,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: statusColor,
                          }}
                        />
                        {statusLabel[campaign.status] || campaign.status}
                      </span>
                    </td>
                    <td style={isMobile ? mobileCellStyle : cellStyle}>
                      {formatCurrency(campaign.spend)}
                    </td>
                    <td style={isMobile ? mobileCellStyle : cellStyle}>
                      <span style={{ color: campaign.roas >= 3 ? '#4ade80' : campaign.roas >= 2 ? '#6366f1' : '#ef4444' }}>
                        {campaign.roas.toFixed(1)}x
                      </span>
                    </td>
                    <td style={isMobile ? mobileCellStyle : cellStyle}>
                      {formatCurrency(campaign.cpa)}
                    </td>
                    {!isMobile && (
                      <td style={cellStyle}>
                        {campaign.ctr.toFixed(1)}%
                      </td>
                    )}
                    {!isMobile && (
                      <td style={cellStyle}>
                        <span style={{ color: campaign.frequency > 2.5 ? '#ef4444' : '#64748b' }}>
                          {campaign.frequency.toFixed(1)}
                        </span>
                      </td>
                    )}
                    <td style={isMobile ? mobileCellStyle : cellStyle}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 40,
                          height: 26,
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "'Outfit', sans-serif",
                          background: `${scoreColor}18`,
                          color: scoreColor,
                          boxShadow: `0 0 8px ${scoreColor}20 inset`,
                          padding: '0 10px',
                        }}
                      >
                        {campaign.opportunity_score}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {mockCampaigns.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: '#a3a3a3' }}>Nenhuma campanha encontrada</div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const cellStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 13,
  fontWeight: 500,
  color: '#334155',
  textAlign: 'right',
  borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
  fontFamily: "'JetBrains Mono', monospace",
};

const mobileCellStyle: React.CSSProperties = {
  padding: '10px 10px',
  fontSize: 11,
  fontWeight: 500,
  color: '#334155',
  textAlign: 'right',
  borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
  fontFamily: "'JetBrains Mono', monospace",
};

export default Dashboard;
