import React from 'react';
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
  const { selectedPeriod } = useStore();
  const isMobile = useIsMobile();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Global animation styles */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1
            style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: '#f1f5f9',
              margin: 0,
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(148, 163, 184, 0.7)', margin: '4px 0 0' }}>
            Visão geral da performance das campanhas
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 10,
            padding: 3,
            border: '1px solid rgba(255, 255, 255, 0.06)',
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
                background: selectedPeriod === p ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                color: selectedPeriod === p ? '#c4b5fd' : 'rgba(148, 163, 184, 0.6)',
              }}
            >
              {p === 'today' ? 'Hoje' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Grid + Account Score */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 220px', gap: 24, alignItems: 'start' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? 10 : 16,
          }}
        >
          {mockMetricCards.map((card, i) => (
            <div key={card.label} style={{ animationDelay: `${i * 60}ms` }}>
              <MetricCard
                label={card.label}
                value={card.value}
                change={card.change}
                sparkline={card.sparkline}
                invertChange={INVERT_LABELS.includes(card.label)}
              />
            </div>
          ))}
        </div>
        <AccountScore score={mockDashboardMetrics.accountScore} />
      </div>

      {/* Campaigns Table */}
      <div
        style={{
          background: 'rgba(22, 22, 32, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 16,
          overflow: 'hidden',
          animation: 'fadeInUp 0.7s ease-out both',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: '#f1f5f9',
              margin: 0,
            }}
          >
            Campanhas
          </h2>
          <span style={{ fontSize: 12, color: 'rgba(148, 163, 184, 0.6)' }}>
            {mockCampaigns.length} campanhas
          </span>
        </div>

        <div style={{ overflowX: 'auto', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' as never }}>
          <table role="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr role="row">
                {['Nome', 'Status', 'Gasto', 'ROAS', 'CPA', 'CTR', 'Frequência', 'Score']
                  .filter((h) => !(isMobile && ['Frequência', 'CPM', 'CTR'].includes(h)))
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
                      color: 'rgba(148, 163, 184, 0.5)',
                      textAlign: h === 'Nome' ? 'left' : 'right',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
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
                      transition: 'background 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td
                      role="cell"
                      style={{
                        padding: isMobile ? '10px 10px' : '14px 16px',
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: 500,
                        color: '#e2e8f0',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        maxWidth: isMobile ? 160 : 280,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {campaign.name}
                    </td>
                    <td
                      role="cell"
                      style={{
                        padding: '14px 16px',
                        textAlign: 'right',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
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
                      <span style={{ color: campaign.roas >= 3 ? '#4ade80' : campaign.roas >= 2 ? '#facc15' : '#f87171' }}>
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
                        <span style={{ color: campaign.frequency > 2.5 ? '#f87171' : '#94a3b8' }}>
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
                          width: 36,
                          height: 24,
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "'Space Grotesk', sans-serif",
                          background: `${scoreColor}18`,
                          color: scoreColor,
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
              <div style={{ fontSize: 14, color: '#64748b' }}>Nenhuma campanha encontrada</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const cellStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 13,
  fontWeight: 500,
  color: '#94a3b8',
  textAlign: 'right',
  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  fontFamily: "'Space Grotesk', sans-serif",
};

const mobileCellStyle: React.CSSProperties = {
  padding: '10px 10px',
  fontSize: 11,
  fontWeight: 500,
  color: '#94a3b8',
  textAlign: 'right',
  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  fontFamily: "'Space Grotesk', sans-serif",
};

export default Dashboard;
