import React from 'react';
import { motion } from 'motion/react';
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
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      style={{
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        boxShadow: '0 0 0 0.5px rgba(255,255,255,0.04) inset, 0 1px 0 0 rgba(255,255,255,0.06) inset, 0 -1px 0 0 rgba(0,0,0,0.4) inset, 0 2px 4px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.25), 0 24px 48px rgba(0,0,0,0.15)',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
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

      <svg width={svgSize} height={svgSize} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="50%" stopColor="#34d399" stopOpacity={0.8} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
          <filter id="score-glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feFlood floodColor="#10b981" floodOpacity="0.35" result="amberGlow" />
            <feComposite in="amberGlow" in2="coloredBlur" operator="in" result="tintedGlow" />
            <feMerge>
              <feMergeNode in="tintedGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer background ring (decorative) */}
        <circle
          cx={center}
          cy={center}
          r={radius + 6}
          fill="none"
          stroke="rgba(255, 255, 255, 0.02)"
          strokeWidth={1}
        />
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
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
        {/* Score text -- rotated back to normal */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: `${center}px ${center}px`,
            fontFamily: "'Satoshi', 'General Sans', sans-serif",
            fontSize: isMobile ? 40 : 56,
            fontWeight: 900,
            fill: '#f5f5f5',
          }}
        >
          {score}
        </text>
      </svg>

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'Satoshi', 'General Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#525252',
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
    </motion.div>
  );
};

export default AccountScore;
