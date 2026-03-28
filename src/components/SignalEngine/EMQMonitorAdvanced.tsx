import { useState } from 'react';
import type { EMQAnalysis } from '../../types/capi';
import { Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { COLORS } from '../../utils/constants';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface Props {
  analysis: EMQAnalysis;
}

export default function EMQMonitorAdvanced({ analysis }: Props) {
  const [hoveredParam, setHoveredParam] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const score = analysis.overall_score;
  const gaugeColor = score >= 9 ? COLORS.success : score >= 8 ? '#22c55e' : score >= 6 ? COLORS.warning : COLORS.danger;

  const radius = isMobile ? 50 : 62;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = Math.min(score / 10, 1);
  const offset = circumference - scorePercent * circumference;

  const levelConfig = {
    excellent: { label: 'EXCELENTE', color: COLORS.success, icon: CheckCircle },
    good: { label: 'BOM', color: '#22c55e', icon: CheckCircle },
    warning: { label: 'AVISO', color: COLORS.warning, icon: AlertTriangle },
    critical: { label: 'CRÍTICO', color: COLORS.danger, icon: AlertTriangle },
  };

  const { label: levelLabel, color: levelColor, icon: LevelIcon } = levelConfig[analysis.level];

  const totalImpact = analysis.parameters.reduce((s, p) => s + p.estimated_impact, 0);
  const maxImpact = analysis.parameters.reduce((s, p) => s + p.max_impact, 0);

  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderRadius: 16, padding: isMobile ? 16 : 24, height: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={18} color={COLORS.accent} />
          <span style={{ color: COLORS.text, fontSize: 15, fontWeight: 600 }}>EMQ Monitor</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: `${levelColor}11`, border: `1px solid ${levelColor}22`,
          borderRadius: 6, padding: '3px 10px',
        }}>
          <LevelIcon size={12} color={levelColor} />
          <span style={{ fontSize: 11, fontWeight: 700, color: levelColor }}>{levelLabel}</span>
        </div>
      </div>

      {/* Circular Gauge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? 14 : 20, position: 'relative' }}>
        <svg width={isMobile ? 120 : 152} height={isMobile ? 120 : 152} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <filter id="emq-adv-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="emq-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={COLORS.accent} />
              <stop offset="100%" stopColor={gaugeColor} />
            </linearGradient>
          </defs>
          <circle cx={isMobile ? 60 : 76} cy={isMobile ? 60 : 76} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={isMobile ? 8 : 10} />
          <circle cx={isMobile ? 60 : 76} cy={isMobile ? 60 : 76} r={radius} fill="none"
            stroke="url(#emq-gradient)" strokeWidth={isMobile ? 8 : 10}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
          <circle cx={isMobile ? 60 : 76} cy={isMobile ? 60 : 76} r={radius} fill="none"
            stroke={gaugeColor} strokeWidth={3} opacity={0.25}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" filter="url(#emq-adv-glow)" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, color: gaugeColor, lineHeight: 1,
            textShadow: `0 0 20px ${gaugeColor}44` }}>
            {score.toFixed(1)}
          </span>
          <span style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>/ 10</span>
        </div>
      </div>

      {/* Impact Summary */}
      <div style={{
        display: 'flex', justifyContent: 'space-around', marginBottom: 16,
        padding: '10px 0', borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{totalImpact.toFixed(1)}</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted }}>Impacto Atual</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>{maxImpact.toFixed(1)}</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted }}>Impacto Max</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.success }}>
            {analysis.parameters.filter(p => p.present).length}/{analysis.parameters.length}
          </div>
          <div style={{ fontSize: 10, color: COLORS.textMuted }}>Params Ativos</div>
        </div>
      </div>

      {/* Parameter Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
        {analysis.parameters.map(param => {
          const percent = param.max_impact > 0 ? (param.estimated_impact / param.max_impact) * 100 : 0;
          const isHovered = hoveredParam === param.key;
          const barColor = param.present ? COLORS.accent : 'rgba(255,255,255,0.06)';

          return (
            <div key={param.key}
              onMouseEnter={() => setHoveredParam(param.key)}
              onMouseLeave={() => setHoveredParam(null)}
              style={{ position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: param.present ? COLORS.success : COLORS.danger,
                    boxShadow: param.present ? `0 0 4px ${COLORS.success}` : 'none',
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: param.present ? COLORS.text : COLORS.textMuted }}>
                    {param.label}
                  </span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: param.present ? COLORS.text : COLORS.textMuted, fontFamily: 'monospace' }}>
                  +{param.estimated_impact.toFixed(1)}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(percent, 100)}%`, borderRadius: 2,
                  background: param.present
                    ? `linear-gradient(90deg, ${barColor}, ${COLORS.accent}88)`
                    : 'rgba(255,255,255,0.06)',
                  transition: 'width 0.5s ease',
                }} />
              </div>

              {isHovered && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(12, 12, 20, 0.95)', border: `1px solid ${COLORS.border}`,
                  borderRadius: 8, padding: '6px 10px', fontSize: 10, color: COLORS.text,
                  whiteSpace: 'nowrap', zIndex: 10, marginBottom: 4,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                  {param.present ? `Contribuindo ${param.estimated_impact}/${param.max_impact}` : `Ausente — potencial +${param.max_impact}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      <div style={{
        marginTop: 12, padding: '8px 12px', borderRadius: 8,
        background: `${levelColor}08`, border: `1px solid ${levelColor}15`,
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <Info size={14} color={levelColor} style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>
          {analysis.recommendation}
        </span>
      </div>
    </div>
  );
}
