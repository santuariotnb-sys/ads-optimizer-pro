import React, { useState } from 'react';
import { mockCampaigns, mockAdSetsData } from '../../data/mockData';
import { formatCurrency, getStatusColor, getScoreColor } from '../../utils/formatters';
import type { AdSet } from '../../types/meta';
import { ChevronDown, ChevronUp, Pause, TrendingUp, Copy, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { showToast } from '../ui/toastStore';

const statusLabel: Record<string, string> = {
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  LEARNING: 'Aprendizado',
  LEARNING_LIMITED: 'Aprendizado Limitado',
};

const statusBorderColor: Record<string, string> = {
  ACTIVE: '#4ade80',
  PAUSED: '#64748b',
  LEARNING: '#6366f1',
  LEARNING_LIMITED: '#f87171',
};

const Campaigns: React.FC = () => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const isMobile = useIsMobile();

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = mockCampaigns.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes expandIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 600px; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 12 : 0 }}>
        <div>
          <h1
            style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              color: '#0f172a',
              margin: 0,
            }}
          >
            Campanhas
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Gerencie e monitore todas as suas campanhas ativas
          </p>
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(15, 23, 42, 0.04)',
            border: `1px solid ${searchFocused ? 'rgba(99,102,241,0.4)' : 'rgba(15, 23, 42, 0.08)'}`,
            borderRadius: 10,
            padding: '8px 14px',
            width: isMobile ? '100%' : 280,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: searchFocused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2}>
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar campanhas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#0f172a',
              fontSize: 13,
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Campaign Cards */}
      {filtered.length === 0 && (
        <div
          className="tilt-card"
          style={{
            background: 'rgba(255, 255, 255, 0.34)',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            borderRadius: 20,
            padding: 40,
            textAlign: 'center',
            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06), 0 12px 40px rgba(15,23,42,0.04)',
          }}
        >
          <div style={{ fontSize: 14, color: '#64748b' }}>Nenhuma campanha encontrada</div>
        </div>
      )}
      {filtered.map((campaign, idx) => {
        const expanded = expandedIds.has(campaign.id);
        const adSets = mockAdSetsData.filter((as) => as.campaign_id === campaign.id);
        const borderColor = statusBorderColor[campaign.status] || '#64748b';
        const scoreColor = getScoreColor(campaign.opportunity_score);
        const hasLearning = campaign.status === 'LEARNING' || campaign.status === 'LEARNING_LIMITED';
        const learningProgress = campaign.learning_conversions && campaign.learning_days
          ? Math.min((campaign.learning_conversions / 50) * 100, 100)
          : 0;

        return (
          <div
            key={campaign.id}
            className="tilt-card"
            style={{
              background: 'rgba(255, 255, 255, 0.34)',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              borderLeft: `3px solid ${borderColor}`,
              borderRadius: 20,
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: `fadeInUp 0.5s ease-out ${idx * 80}ms both`,
              boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06), 0 12px 40px rgba(15,23,42,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = `1px solid rgba(15, 23, 42, 0.14)`;
              e.currentTarget.style.borderLeft = `3px solid ${borderColor}`;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid rgba(15, 23, 42, 0.08)';
              e.currentTarget.style.borderLeft = `3px solid ${borderColor}`;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Card Header */}
            <div
              onClick={() => toggle(campaign.id)}
              style={{
                padding: '18px 20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {/* Top row: name, status, score, expand */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {campaign.name}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      color: borderColor,
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: `${borderColor}15`,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: borderColor }} />
                    {statusLabel[campaign.status]}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  {/* Opportunity Score */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 8,
                      background: `${scoreColor}12`,
                    }}
                  >
                    <span style={{ fontSize: 11, color: '#64748b' }}>Score</span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "'Outfit', sans-serif",
                        color: scoreColor,
                      }}
                    >
                      {campaign.opportunity_score}
                    </span>
                  </div>

                  {expanded ? (
                    <ChevronUp size={18} color="#94a3b8" />
                  ) : (
                    <ChevronDown size={18} color="#94a3b8" />
                  )}
                </div>
              </div>

              {/* Metrics row */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 16 }}>
                {[
                  { label: 'ROAS', value: `${campaign.roas.toFixed(1)}x`, color: campaign.roas >= 3 ? '#4ade80' : campaign.roas >= 2 ? '#6366f1' : '#f87171' },
                  { label: 'CPA', value: formatCurrency(campaign.cpa), color: '#94a3b8' },
                  { label: 'CTR', value: `${campaign.ctr.toFixed(1)}%`, color: '#94a3b8' },
                  { label: 'Gasto', value: formatCurrency(campaign.spend), color: '#94a3b8' },
                ].map((m) => (
                  <div key={m.label}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#334155',
                        marginBottom: 2,
                      }}
                    >
                      {m.label}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        fontFamily: "'Outfit', sans-serif",
                        color: m.color,
                      }}
                    >
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Learning Phase Indicator */}
              {hasLearning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={14} color="#6366f1" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
                        Fase de Aprendizado
                      </span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        {campaign.learning_conversions || 0}/50 conversões
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: 4,
                        borderRadius: 2,
                        background: 'rgba(15, 23, 42, 0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${learningProgress}%`,
                          height: '100%',
                          borderRadius: 2,
                          background: campaign.status === 'LEARNING_LIMITED' ? '#f87171' : '#6366f1',
                          transition: 'width 0.6s ease-out',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Budget Suggestion */}
              {campaign.budget_suggestion && campaign.budget_suggestion !== campaign.daily_budget && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(139, 92, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.15)',
                  }}
                >
                  <TrendingUp size={14} color="#4f46e5" />
                  <span style={{ fontSize: 12, color: '#8b5cf6' }}>
                    Sugestão: ajustar orçamento diário para{' '}
                    <strong>{formatCurrency(campaign.budget_suggestion)}</strong>
                    {campaign.budget_suggestion > campaign.daily_budget
                      ? ' (escalar)'
                      : ' (reduzir para otimizar)'}
                  </span>
                </div>
              )}
            </div>

            {/* Expanded: Ad Sets + Actions */}
            {expanded && (
              <div
                style={{
                  borderTop: '1px solid rgba(15, 23, 42, 0.05)',
                  animation: 'expandIn 0.3s ease-out both',
                  overflow: 'hidden',
                }}
              >
                {/* Action Buttons */}
                <div
                  style={{
                    padding: '12px 20px',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 8,
                    borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
                  }}
                >
                  {[
                    { icon: <Pause size={13} />, label: 'Pausar', color: '#64748b' },
                    { icon: <TrendingUp size={13} />, label: 'Escalar +20%', color: '#4ade80' },
                    { icon: <Copy size={13} />, label: 'Duplicar', color: '#60a5fa' },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={(e) => { e.stopPropagation(); showToast('info', `${btn.label}: disponível no modo Live. Conecte sua conta Meta nas Configurações.`); }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: isMobile ? '10px 14px' : '6px 14px',
                        borderRadius: 8,
                        border: `1px solid ${btn.color}30`,
                        background: `${btn.color}10`,
                        color: btn.color,
                        fontSize: isMobile ? 13 : 12,
                        minHeight: isMobile ? 44 : undefined,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${btn.color}20`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${btn.color}10`;
                      }}
                    >
                      {btn.icon}
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Ad Sets */}
                <div style={{ padding: '12px 20px 16px', overflowX: isMobile ? 'auto' : undefined }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#334155',
                      marginBottom: 10,
                    }}
                  >
                    Conjuntos de Anúncios ({adSets.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {adSets.map((adSet: AdSet) => {
                      const asStatusColor = getStatusColor(adSet.status);
                      return (
                        <div
                          key={adSet.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr 1fr' : '1.5fr repeat(5, 1fr)',
                            alignItems: isMobile ? 'start' : 'center',
                            gap: isMobile ? 8 : 12,
                            padding: isMobile ? '12px 12px' : '10px 14px',
                            borderRadius: 10,
                            background: 'rgba(15, 23, 42, 0.03)',
                            border: '1px solid rgba(15, 23, 42, 0.05)',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.03)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, gridColumn: isMobile ? '1 / -1' : undefined }}>
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: asStatusColor,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: '#334155',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {adSet.name}
                            </span>
                          </div>
                          {[
                            { label: 'ROAS', value: `${adSet.roas.toFixed(1)}x` },
                            { label: 'CPA', value: formatCurrency(adSet.cpa) },
                            { label: 'CTR', value: `${adSet.ctr.toFixed(1)}%` },
                            { label: 'CPM', value: formatCurrency(adSet.cpm) },
                            { label: 'Gasto', value: formatCurrency(adSet.spend) },
                          ].map((m) => (
                            <div key={m.label} style={{ textAlign: 'right' }}>
                              <div
                                style={{
                                  fontSize: 9,
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  color: '#334155',
                                  marginBottom: 1,
                                }}
                              >
                                {m.label}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  fontFamily: "'Outfit', sans-serif",
                                  color: '#334155',
                                }}
                              >
                                {m.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Campaigns;
