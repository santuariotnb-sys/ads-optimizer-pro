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
  const changeColor = isGood ? '#84cc16' : '#ef4444';
  const sparkColor = '#f59e0b';
  const arrow = isPositiveChange ? '↑' : '↓';

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #1a1918 0%, #151413 100%)',
        border: '1px solid rgba(255, 200, 120, 0.06)',
        borderRadius: 20,
        boxShadow: '0 1px 0 0 rgba(255,200,120,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.2) inset, 0 4px 16px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.25)',
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
        el.style.border = '1px solid rgba(255, 200, 120, 0.14)';
        el.style.boxShadow = '0 1px 0 0 rgba(255,200,120,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.2) inset, 0 4px 16px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.25), 0 0 30px rgba(245,158,11,0.06)';
        el.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.border = '1px solid rgba(255, 200, 120, 0.06)';
        el.style.boxShadow = '0 1px 0 0 rgba(255,200,120,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.2) inset, 0 4px 16px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.25)';
        el.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#78716c',
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
            fontSize: isMobile ? 22 : 28,
            fontWeight: 700,
            fontFamily: "'Sora', sans-serif",
            color: '#fafaf9',
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
