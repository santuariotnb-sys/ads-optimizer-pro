import React from 'react';
import { motion } from 'motion/react';
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
  const lastX = width;
  const lastY = height - ((data[data.length - 1] - min) / range) * height;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.45} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth={1.5} points={points} strokeLinejoin="round" strokeLinecap="round" />
      <polygon fill={`url(#sg-${color.replace('#', '')})`} points={`0,${height} ${points} ${width},${height}`} />
      {/* Glow dot at end of sparkline */}
      <circle
        cx={lastX}
        cy={lastY}
        r={3}
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      >
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, sparkline, invertChange = false }) => {
  const isMobile = useIsMobile();
  const isPositiveChange = change > 0;
  const isGood = invertChange ? !isPositiveChange : isPositiveChange;
  const changeColor = isGood ? '#4ade80' : '#f87171';
  const sparkColor = '#6366f1';
  const arrow = isPositiveChange ? '\u2191' : '\u2193';

  return (
    <motion.div
      variants={cardVariants}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -3,
        transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
      }}
      style={{
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: isMobile ? 14 : 22,
        boxShadow: '0 0 0 0.5px rgba(255,255,255,0.04) inset, 0 1px 0 0 rgba(255,255,255,0.06) inset, 0 -1px 0 0 rgba(0,0,0,0.4) inset, 0 2px 4px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.25), 0 24px 48px rgba(0,0,0,0.15)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Shimmer light reflection */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
        borderRadius: '20px 20px 0 0',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#525252',
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
        <span
          style={{
            fontSize: isMobile ? 24 : 32,
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            color: '#f5f5f5',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <MiniSparkline data={sparkline} color={sparkColor} width={isMobile ? 48 : 80} />
      </div>
    </motion.div>
  );
};

export default MetricCard;
