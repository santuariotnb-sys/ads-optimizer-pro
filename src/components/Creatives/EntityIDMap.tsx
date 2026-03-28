import { useState } from 'react';
import { mockEntityGroups } from '../../data/mockData';
import { formatCurrency } from '../../utils/formatters';
import { Layers, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

const COLORS = {
  surface: '#1a1918',
  border: 'rgba(255, 200, 120, 0.06)',
  text: '#fafaf9',
  textMuted: '#a8a29e',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#84cc16',
};

const groupColors = ['#f59e0b', '#fbbf24', '#d97706', '#fb923c', '#06b6d4'];

export default function EntityIDMap() {
  const isMobile = useIsMobile();
  const [hoveredGroup, setHoveredGroup] = useState<number | null>(null);
  const groups = mockEntityGroups;
  const totalCreatives = groups.reduce((s, g) => s + g.creatives.length, 0);
  const totalEntities = groups.length;
  const overcrowded = groups.filter(g => g.is_overcrowded);

  const svgWidth = Math.max(groups.length * 220, 660);
  const svgHeight = 200;
  const centerY = svgHeight / 2;

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1918 0%, #151413 100%)',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      boxShadow: '0 1px 0 0 rgba(255,200,120,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.2) inset, 0 4px 16px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.25)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Layers size={20} color={COLORS.accent} />
          <span style={{ color: COLORS.text, fontSize: 16, fontWeight: 600 }}>Mapa de Entity IDs</span>
        </div>
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 13,
          color: COLORS.accent,
          fontWeight: 500,
        }}>
          {totalCreatives} criativos reais &rarr; {totalEntities} Entity IDs no leilao
        </div>
      </div>

      {/* Warning banner */}
      {overcrowded.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <AlertTriangle size={16} color={COLORS.danger} />
          <span style={{ color: COLORS.danger, fontSize: 13 }}>
            {overcrowded.length} grupo(s) com mais de 3 criativos — competicao interna no leilao!
            Redistribua criativos para reduzir sobreposicao.
          </span>
        </div>
      )}

      {/* SVG Visualization */}
      <div style={{ overflowX: 'auto', borderRadius: 12, background: 'rgba(10, 10, 10, 0.5)', padding: 16 }}>
        <svg width={isMobile ? '100%' : svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ minWidth: isMobile ? svgWidth : undefined }}>
          {/* Connecting line */}
          <line
            x1={60} y1={centerY} x2={svgWidth - 60} y2={centerY}
            stroke="rgba(245, 158, 11, 0.15)" strokeWidth={2} strokeDasharray="6 4"
          />

          {groups.map((group, idx) => {
            const cx = 110 + idx * 200;
            const color = groupColors[idx % groupColors.length];
            const isHovered = hoveredGroup === group.entity_id;
            const isOvercrowded = group.is_overcrowded;
            const radius = 32;
            const creativeRadius = 14;

            return (
              <g
                key={group.entity_id}
                onMouseEnter={() => setHoveredGroup(group.entity_id)}
                onMouseLeave={() => setHoveredGroup(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Overcrowded pulse */}
                {isOvercrowded && (
                  <circle cx={cx} cy={centerY} r={radius + 12} fill="none"
                    stroke={COLORS.danger} strokeWidth={1.5} opacity={0.4}>
                    <animate attributeName="r" values={`${radius + 8};${radius + 18};${radius + 8}`}
                      dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Glow on hover */}
                {isHovered && (
                  <circle cx={cx} cy={centerY} r={radius + 6}
                    fill="none" stroke={color} strokeWidth={2} opacity={0.5} />
                )}

                {/* Main circle */}
                <circle cx={cx} cy={centerY} r={radius}
                  fill={isOvercrowded ? 'rgba(239, 68, 68, 0.15)' : `${color}22`}
                  stroke={isOvercrowded ? COLORS.danger : color}
                  strokeWidth={2}
                />

                {/* Entity ID label */}
                <text x={cx} y={centerY - 4} textAnchor="middle" fill={COLORS.text}
                  fontSize={11} fontWeight={600}>
                  Entity
                </text>
                <text x={cx} y={centerY + 12} textAnchor="middle" fill={color}
                  fontSize={14} fontWeight={700}>
                  #{group.entity_id}
                </text>

                {/* Creative dots around */}
                {group.creatives.map((cr, ci) => {
                  const angle = (ci / group.creatives.length) * Math.PI * 2 - Math.PI / 2;
                  const orbitR = radius + 28;
                  const dotX = cx + Math.cos(angle) * orbitR;
                  const dotY = centerY + Math.sin(angle) * orbitR;
                  const dotColor = cr.status === 'winner' ? COLORS.success
                    : cr.status === 'testing' ? '#06b6d4' : COLORS.danger;

                  return (
                    <g key={cr.id}>
                      <line x1={cx + Math.cos(angle) * radius} y1={centerY + Math.sin(angle) * radius}
                        x2={dotX} y2={dotY} stroke={`${color}44`} strokeWidth={1} />
                      <circle cx={dotX} cy={dotY} r={creativeRadius}
                        fill={`${dotColor}22`} stroke={dotColor} strokeWidth={1.5} />
                      <text x={dotX} y={dotY + 4} textAnchor="middle" fill={COLORS.text}
                        fontSize={8} fontWeight={500}>
                        {cr.name.slice(0, 3)}
                      </text>
                    </g>
                  );
                })}

                {/* Count badge */}
                <rect x={cx + radius - 4} y={centerY - radius - 4} width={22} height={16} rx={8}
                  fill={isOvercrowded ? COLORS.danger : color} />
                <text x={cx + radius + 7} y={centerY - radius + 8} textAnchor="middle"
                  fill="#fff" fontSize={10} fontWeight={700}>
                  {group.creatives.length}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: isMobile ? 10 : 16, marginTop: 16, overflowX: isMobile ? 'auto' : undefined, WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>
        {groups.map((group, idx) => {
          const color = groupColors[idx % groupColors.length];
          return (
            <div key={group.entity_id} style={{
              flex: 1,
              minWidth: isMobile ? 180 : undefined,
              background: 'rgba(10, 10, 10, 0.5)',
              border: `1px solid ${group.is_overcrowded ? 'rgba(239,68,68,0.3)' : COLORS.border}`,
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>Entity #{group.entity_id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.textMuted }}>
                <span>CPA Medio: {formatCurrency(group.avg_cpa)}</span>
                <span>Gasto: {formatCurrency(group.total_spend)}</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                {group.creatives.length} criativo(s)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
