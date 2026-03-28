import React from 'react';
import { getScoreColor, getScoreLabel } from '../../utils/formatters';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface AccountScoreProps {
  score: number;
}

const AccountScore: React.FC<AccountScoreProps> = ({ score }) => {
  const isMobile = useIsMobile();
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const svgSize = isMobile ? 140 : 180;
  const center = svgSize / 2;
  const radius = isMobile ? 54 : 70;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const dashoffset = circumference - progress;

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #1a1918 0%, #151413 100%)',
        border: '1px solid rgba(255, 200, 120, 0.06)',
        borderRadius: 20,
        boxShadow: '0 1px 0 0 rgba(255,200,120,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.2) inset, 0 4px 16px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.25)',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        animation: 'fadeInUp 0.6s ease-out both',
      }}
    >
      <svg width={svgSize} height={svgSize} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.8} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
          <filter id="score-glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.3" result="amberGlow" />
            <feComposite in="amberGlow" in2="coloredBlur" operator="in" result="tintedGlow" />
            <feMerge>
              <feMergeNode in="tintedGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 200, 120, 0.06)"
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#score-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          filter="url(#score-glow)"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'scoreRingIn 1.2s cubic-bezier(0.4, 0, 0.2, 1) both',
          }}
        />
        {/* Score text — rotated back to normal */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: `${center}px ${center}px`,
            fontFamily: "'Sora', sans-serif",
            fontSize: isMobile ? 36 : 48,
            fontWeight: 700,
            fill: '#fafaf9',
          }}
        >
          {score}
        </text>
      </svg>

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#78716c',
            marginBottom: 4,
          }}
        >
          Score da Conta
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 14px',
            borderRadius: 20,
            background: `${color}15`,
          }}
        >
          {label}
        </div>
      </div>

      <style>{`
        @keyframes scoreRingIn {
          from { stroke-dashoffset: ${circumference}; }
          to { stroke-dashoffset: ${dashoffset}; }
        }
      `}</style>
    </div>
  );
};

export default AccountScore;
