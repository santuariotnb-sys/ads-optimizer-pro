import { useState } from 'react';
import type { ValueRule } from '../../types/capi';
import { TrendingUp, Plus } from 'lucide-react';
import { COLORS } from '../../utils/constants';

interface Props {
  rules: ValueRule[];
  onToggle: (id: string) => void;
}

export default function ValueRulesPanel({ rules, onToggle }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
      borderRadius: 16, padding: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={18} color={COLORS.purple} />
          <span style={{ color: COLORS.text, fontSize: 15, fontWeight: 600 }}>Value Rules</span>
          <span style={{
            background: 'rgba(167, 139, 250, 0.12)', borderRadius: 6, padding: '2px 8px',
            fontSize: 10, fontWeight: 600, color: COLORS.purple,
          }}>
            +46% ROAS case study
          </span>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: '5px 10px', fontSize: 11, color: COLORS.textMuted,
          cursor: 'pointer',
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
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: rule.enabled ? 'rgba(167, 139, 250, 0.04)' : 'rgba(12, 12, 20, 0.4)',
                border: `1px solid ${rule.enabled ? 'rgba(167, 139, 250, 0.12)' : COLORS.border}`,
                borderRadius: 10,
                opacity: rule.enabled ? 1 : 0.6,
                transition: 'all 0.2s ease',
                transform: isHovered ? 'translateX(2px)' : 'none',
              }}
            >
              <button
                onClick={() => onToggle(rule.id)}
                style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: rule.enabled
                    ? `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.pink})`
                    : 'rgba(255,255,255,0.08)',
                  border: 'none', cursor: 'pointer', position: 'relative', padding: 0,
                  transition: 'background 0.2s ease', flexShrink: 0,
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 2,
                  left: rule.enabled ? 18 : 2,
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
                  fontFamily: '"JetBrains Mono", monospace',
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
        background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.1)',
        fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5,
      }}>
        Value Rules dizem ao Andromeda quanto valorizar cada segmento no leilão. Laura Geller obteve <span style={{ color: COLORS.purple, fontWeight: 600 }}>+46% ROAS</span> com Value Optimization + custom event "first-time purchaser".
      </div>
    </div>
  );
}
