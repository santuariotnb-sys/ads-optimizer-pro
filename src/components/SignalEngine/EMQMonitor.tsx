import { useState } from 'react';
import { mockEMQ } from '../../data/mockData';
import { EMQ_WEIGHTS } from '../../utils/constants';
import { Activity, AlertTriangle } from 'lucide-react';
import type { EMQBreakdown } from '../../types/meta';
import { useIsMobile } from '../../hooks/useMediaQuery';

const COLORS = {
  surface: 'rgba(22, 22, 32, 0.85)',
  border: 'rgba(255, 255, 255, 0.06)',
  text: '#f5f5f5',
  textMuted: '#a3a3a3',
  accent: '#6366f1',
  success: '#4ade80',
  danger: '#f87171',
  warning: '#6366f1',
};

const paramLabels: Record<string, string> = {
  email: 'E-mail (em)',
  phone: 'Telefone (ph)',
  external_id: 'External ID',
  ip_ua: 'IP + User Agent',
  fbp: 'FB Pixel (fbp)',
  fbc: 'FB Click (fbc)',
};

export default function EMQMonitor() {
  const isMobile = useIsMobile();
  const [hoveredParam, setHoveredParam] = useState<string | null>(null);
  const emq = mockEMQ;
  const maxWeights = EMQ_WEIGHTS;
  const maxTotal = Object.values(maxWeights).reduce((s, v) => s + v, 0);
  const isLow = emq.total < 8.0;

  // Gauge calculations
  const radius = isMobile ? 45 : 60;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = Math.min(emq.total / 10, 1);
  const offset = circumference - scorePercent * circumference;
  const gaugeColor = emq.total >= 8.5 ? COLORS.success : emq.total >= 6 ? COLORS.warning : COLORS.danger;

  const params = Object.entries(maxWeights) as [keyof typeof maxWeights, number][];

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(22, 22, 32, 0.85) 0%, rgba(16, 16, 26, 0.9) 100%)',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 20,
      padding: isMobile ? 16 : 24,
      height: '100%',
      boxShadow: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.2) inset, 0 4px 16px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isMobile ? 14 : 20 }}>
        <Activity size={18} color={COLORS.accent} />
        <span style={{ color: COLORS.text, fontSize: 15, fontWeight: 600 }}>EMQ Monitor</span>
      </div>

      {/* Low EMQ Alert */}
      {isLow && (
        <div style={{
          background: 'rgba(248, 113, 113, 0.08)',
          border: '1px solid rgba(248, 113, 113, 0.2)',
          borderRadius: 8, padding: '8px 12px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: COLORS.danger,
        }}>
          <AlertTriangle size={14} />
          EMQ abaixo de 8.0 — qualidade de match comprometida
        </div>
      )}

      {/* Circular Gauge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? 16 : 24, position: 'relative' }}>
        <svg width={isMobile ? 110 : 148} height={isMobile ? 110 : 148} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle cx={isMobile ? 55 : 74} cy={isMobile ? 55 : 74} r={radius} fill="none"
            stroke="rgba(255,255,255,0.04)" strokeWidth={isMobile ? 8 : 10} />
          {/* Score arc */}
          <circle cx={isMobile ? 55 : 74} cy={isMobile ? 55 : 74} r={radius} fill="none"
            stroke={gaugeColor} strokeWidth={isMobile ? 8 : 10}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
          />
          {/* Glow filter */}
          <defs>
            <filter id="emq-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx={isMobile ? 55 : 74} cy={isMobile ? 55 : 74} r={radius} fill="none"
            stroke={gaugeColor} strokeWidth={3} opacity={0.3}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" filter="url(#emq-glow)" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: gaugeColor, lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>
            {emq.total.toFixed(1)}
          </span>
          <span style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
            / {maxTotal.toFixed(1)} max
          </span>
        </div>
      </div>

      {/* Parameter Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {params.map(([key, maxWeight]) => {
          const currentValue = emq[key as keyof EMQBreakdown] as number;
          const percent = (currentValue / maxWeight) * 100;
          const isContributing = currentValue > 0;
          const isHovered = hoveredParam === key;
          const barColor = isContributing ? COLORS.accent : 'rgba(255,255,255,0.08)';

          return (
            <div
              key={key}
              onMouseEnter={() => setHoveredParam(key)}
              onMouseLeave={() => setHoveredParam(null)}
              style={{ position: 'relative' }}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 4,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  color: isContributing ? COLORS.text : COLORS.textMuted,
                }}>
                  {paramLabels[key] || key}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: isContributing ? COLORS.text : COLORS.textMuted }}>
                  {currentValue.toFixed(1)} / {maxWeight.toFixed(1)}
                </span>
              </div>
              <div style={{
                height: 6, borderRadius: 3,
                background: 'rgba(255,255,255,0.04)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(percent, 100)}%`,
                  borderRadius: 3,
                  background: isContributing
                    ? `linear-gradient(90deg, ${barColor}, ${COLORS.accent}88)`
                    : 'rgba(255,255,255,0.08)',
                  transition: 'width 0.5s ease',
                }} />
              </div>

              {/* Hover tooltip */}
              {isHovered && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(10, 10, 10, 0.95)',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8, padding: '8px 12px',
                  fontSize: 11, color: COLORS.text, whiteSpace: 'nowrap',
                  zIndex: 10, marginBottom: 4,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{paramLabels[key]}</div>
                  <div style={{ color: COLORS.textMuted }}>
                    Peso maximo: {maxWeight.toFixed(1)} | Atual: {currentValue.toFixed(1)} ({percent.toFixed(0)}%)
                  </div>
                  <div style={{ color: isContributing ? COLORS.success : COLORS.danger, marginTop: 2 }}>
                    {isContributing ? 'Contribuindo para match' : 'Nao enviado — match prejudicado'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
