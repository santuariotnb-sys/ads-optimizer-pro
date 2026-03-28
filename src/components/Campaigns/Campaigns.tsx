import React, { useState } from 'react';
import { mockCampaigns, mockAdSetsData } from '../../data/mockData';
import { formatCurrency, getStatusColor, getScoreColor } from '../../utils/formatters';
import type { AdSet } from '../../types/meta';
import { ChevronDown, ChevronUp, Pause, TrendingUp, Copy, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

const statusLabel: Record<string, string> = {
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  LEARNING: 'Aprendizado',
  LEARNING_LIMITED: 'Aprendizado Limitado',
};

const statusBorderColor: Record<string, string> = {
  ACTIVE: '#22c55e',
  PAUSED: '#a3a3a3',
  LEARNING: '#10b981',
  LEARNING_LIMITED: '#ef4444',
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
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: '#f1f5f9',
              margin: 0,
            }}
          >
            Campanhas
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(168, 162, 158, 0.7)', margin: '4px 0 0' }}>
            Gerencie e otimize suas campanhas
          </p>
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${searchFocused ? 'rgba(16,185,129,0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: 10,
            padding: '8px 14px',
            width: isMobile ? '100%' : 280,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: searchFocused ? '0 0 0 3px rgba(16,185,129,0.1)' : 'none',
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(168,162,158,0.5)" strokeWidth={2}>
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
              color: '#f5f5f5',
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
          style={{
            background: 'linear-gradient(145deg, #0a0a0a 0%, #060606 100%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 20,
            padding: 40,
            textAlign: 'center',
            boxShadow: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.2) inset, 0 4px 16px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ fontSize: 14, color: '#a3a3a3' }}>Nenhuma campanha encontrada</div>
        </div>
      )}
      {filtered.map((campaign, idx) => {
        const expanded = expandedIds.has(campaign.id);
        const adSets = mockAdSetsData.filter((as) => as.campaign_id === campaign.id);
        const borderColor = statusBorderColor[campaign.status] || '#a3a3a3';
        const scoreColor = getScoreColor(campaign.opportunity_score);
        const hasLearning = campaign.status === 'LEARNING' || campaign.status === 'LEARNING_LIMITED';
        const learningProgress = campaign.learning_conversions && campaign.learning_days
          ? Math.min((campaign.learning_conversions / 50) * 100, 100)
          : 0;

        return (
          <div
            key={campaign.id}
            style={{
              background: 'linear-gradient(145deg, #0a0a0a 0%, #060606 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderLeft: `3px solid ${borderColor}`,
              borderRadius: 20,
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: `fadeInUp 0.5s ease-out ${idx * 80}ms both`,
              boxShadow: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.2) inset, 0 4px 16px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = `1px solid rgba(255, 255, 255, 0.14)`;
              e.currentTarget.style.borderLeft = `3px solid ${borderColor}`;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.06)';
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
                      color: '#f5f5f5',
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
                    <span style={{ fontSize: 11, color: 'rgba(168,162,158,0.6)' }}>Score</span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        color: scoreColor,
                      }}
                    >
                      {campaign.opportunity_score}
                    </span>
                  </div>

                  {expanded ? (
                    <ChevronUp size={18} color="rgba(168,162,158,0.5)" />
                  ) : (
                    <ChevronDown size={18} color="rgba(168,162,158,0.5)" />
                  )}
                </div>
              </div>

              {/* Metrics row */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 16 }}>
                {[
                  { label: 'ROAS', value: `${campaign.roas.toFixed(1)}x`, color: campaign.roas >= 3 ? '#22c55e' : campaign.roas >= 2 ? '#10b981' : '#ef4444' },
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
                        color: 'rgba(168,162,158,0.5)',
                        marginBottom: 2,
                      }}
                    >
                      {m.label}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
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
                  <AlertTriangle size={14} color="#10b981" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                        Fase de Aprendizado
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(168,162,158,0.6)' }}>
                        {campaign.learning_conversions || 0}/50 conversões
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: 4,
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${learningProgress}%`,
                          height: '100%',
                          borderRadius: 2,
                          background: campaign.status === 'LEARNING_LIMITED' ? '#ef4444' : '#10b981',
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
                    background: 'rgba(52, 211, 153, 0.08)',
                    border: '1px solid rgba(52, 211, 153, 0.15)',
                  }}
                >
                  <TrendingUp size={14} color="#059669" />
                  <span style={{ fontSize: 12, color: '#34d399' }}>
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
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
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
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  {[
                    { icon: <Pause size={13} />, label: 'Pausar', color: '#a3a3a3' },
                    { icon: <TrendingUp size={13} />, label: 'Escalar +20%', color: '#22c55e' },
                    { icon: <Copy size={13} />, label: 'Duplicar', color: '#06b6d4' },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={(e) => e.stopPropagation()}
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
                      color: 'rgba(168,162,158,0.5)',
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
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
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
                                color: '#cbd5e1',
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
                                  color: 'rgba(168,162,158,0.4)',
                                  marginBottom: 1,
                                }}
                              >
                                {m.label}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  color: '#94a3b8',
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
