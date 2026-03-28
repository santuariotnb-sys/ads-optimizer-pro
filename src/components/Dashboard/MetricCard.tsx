import React from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  sparkline: number[];
  invertChange?: boolean;
}

function MiniSparkline({ data, color, width = 80, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth={1.5} points={points} />
      <polygon fill={`url(#sg-${color.replace('#', '')})`} points={`0,${height} ${points} ${width},${height}`} />
    </svg>
  );
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, sparkline, invertChange = false }) => {
  const isMobile = useIsMobile();
  const isPositiveChange = change > 0;
  const isGood = invertChange ? !isPositiveChange : isPositiveChange;
  const changeColor = isGood ? '#4ade80' : '#f87171';
  const sparkColor = isGood ? '#4ade80' : '#f87171';
  const arrow = isPositiveChange ? '↑' : '↓';

  return (
    <div
      style={{
        background: 'rgba(22, 22, 32, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 16,
        padding: isMobile ? 12 : 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        animation: 'fadeInUp 0.5s ease-out both',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.border = '1px solid rgba(255, 255, 255, 0.15)';
        el.style.boxShadow = `0 0 30px rgba(139, 92, 246, 0.08), 0 8px 32px rgba(0, 0, 0, 0.3)`;
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.border = '1px solid rgba(255, 255, 255, 0.06)';
        el.style.boxShadow = 'none';
        el.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'rgba(148, 163, 184, 0.8)',
          }}
        >
          {label}
        </span>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '2px 8px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            background: `${changeColor}15`,
            color: changeColor,
          }}
        >
          <span>{arrow}</span>
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <span
          style={{
            fontSize: isMobile ? 18 : 28,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            color: '#f1f5f9',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <MiniSparkline data={sparkline} color={sparkColor} width={isMobile ? 48 : 80} />
      </div>
    </div>
  );
};

export default MetricCard;
