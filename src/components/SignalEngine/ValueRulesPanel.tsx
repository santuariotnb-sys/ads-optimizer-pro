import { useState } from 'react';
import type { ValueRule } from '../../types/capi';
import { TrendingUp, Plus } from 'lucide-react';
import { COLORS } from '../../utils/constants';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface Props {
  rules: ValueRule[];
  onToggle: (id: string) => void;
}

export default function ValueRulesPanel({ rules, onToggle }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const multiplierColor = (m: number) => {
    if (m > 1) return COLORS.success;
    if (m < 1) return COLORS.danger;
    return COLORS.textMuted;
  };

  const multiplierLabel = (m: number) => {
    if (m > 1) return `+${Math.round((m - 1) * 100)}%`;
    if (m < 1) return `${Math.round((m - 1) * 100)}%`;
    return '0%';
  };

  const conditionText = (rule: ValueRule): string => {
    const parts: string[] = [];
    if (rule.conditions.customer_type) parts.push(`customer_type = "${rule.conditions.customer_type}"`);
    if (rule.conditions.gender) parts.push(`gender = "${rule.conditions.gender}"`);
    if (rule.conditions.age_range) parts.push(`age ${rule.conditions.age_range.min}-${rule.conditions.age_range.max}`);
    if (rule.conditions.geo_locations?.length) parts.push(`geo: ${rule.conditions.geo_locations.join(', ')}`);
    return parts.join(' + ') || 'Sem condição';
  };

  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderRadius: 16, padding: isMobile ? 14 : 24,
    }}>
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 16, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <TrendingUp size={18} color={COLORS.purple} />
          <span style={{ color: COLORS.text, fontSize: isMobile ? 14 : 15, fontWeight: 600 }}>Value Rules</span>
          {!isMobile && <span style={{
            background: 'rgba(5, 150, 105, 0.12)', borderRadius: 6, padding: '2px 8px',
            fontSize: 10, fontWeight: 600, color: COLORS.purple,
          }}>
            +46% ROAS case study
          </span>}
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: isMobile ? '10px 14px' : '5px 10px', fontSize: isMobile ? 12 : 11, color: COLORS.textMuted,
          cursor: 'pointer', minHeight: isMobile ? 40 : undefined,
        }}>
          <Plus size={12} /> Nova Regra
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rules.map(rule => {
          const isHovered = hoveredId === rule.id;
          return (
            <div key={rule.id}
              onMouseEnter={() => setHoveredId(rule.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 12,
                padding: isMobile ? '10px 12px' : '12px 16px',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                background: rule.enabled ? 'rgba(5, 150, 105, 0.04)' : 'rgba(12, 12, 20, 0.4)',
                border: `1px solid ${rule.enabled ? 'rgba(5, 150, 105, 0.12)' : COLORS.border}`,
                borderRadius: 10,
                opacity: rule.enabled ? 1 : 0.6,
                transition: 'all 0.2s ease',
                transform: isHovered ? 'translateX(2px)' : 'none',
              }}
            >
              <button
                onClick={() => onToggle(rule.id)}
                style={{
                  width: isMobile ? 44 : 36, height: isMobile ? 24 : 20, borderRadius: 12,
                  background: rule.enabled
                    ? `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.pink})`
                    : 'rgba(255,255,255,0.08)',
                  border: 'none', cursor: 'pointer', position: 'relative', padding: 0,
                  transition: 'background 0.2s ease', flexShrink: 0,
                }}
              >
                <div style={{
                  width: isMobile ? 18 : 16, height: isMobile ? 18 : 16, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: isMobile ? 3 : 2,
                  left: rule.enabled ? (isMobile ? 23 : 18) : 2,
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{rule.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: 'monospace', marginTop: 2 }}>
                  {conditionText(rule)}
                </div>
              </div>

              <div style={{
                padding: '4px 12px', borderRadius: 8,
                background: `${multiplierColor(rule.bid_multiplier)}11`,
                border: `1px solid ${multiplierColor(rule.bid_multiplier)}22`,
              }}>
                <span style={{
                  fontSize: 14, fontWeight: 700, color: multiplierColor(rule.bid_multiplier),
                  fontFamily: '"Fira Code", monospace',
                }}>
                  {multiplierLabel(rule.bid_multiplier)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 12, padding: '10px 14px', borderRadius: 8,
        background: 'rgba(5, 150, 105, 0.06)', border: '1px solid rgba(5, 150, 105, 0.1)',
        fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5,
      }}>
        Value Rules dizem ao Andromeda quanto valorizar cada segmento no leilão. Laura Geller obteve <span style={{ color: COLORS.purple, fontWeight: 600 }}>+46% ROAS</span> com Value Optimization + custom event "first-time purchaser".
      </div>
    </div>
  );
}
