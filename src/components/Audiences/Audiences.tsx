import { mockAudiences } from '../../data/mockData';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { Users, AlertTriangle, Link2 } from 'lucide-react';
import { useState } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';

const glassCard: React.CSSProperties = {
  background: 'rgba(22,22,32,0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: 24,
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'default',
};

function SaturationGauge({ percent }: { percent: number }) {
  const radius = 28;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent >= 80 ? '#f87171' : percent >= 50 ? '#facc15' : '#4ade80';

  return (
    <svg width={72} height={72} style={{ display: 'block' }}>
      <circle cx={36} cy={36} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={36} cy={36} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={36} y={36} textAnchor="middle" dominantBaseline="central"
        style={{ fill: color, fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
        {percent}%
      </text>
    </svg>
  );
}

function StatusBadge({ status, frequency }: { status: string; frequency: number }) {
  const effectiveStatus = frequency > 2.5 && status !== 'saturated' ? 'warning' : status;
  const map: Record<string, { color: string; label: string }> = {
    active: { color: '#4ade80', label: 'Ativo' },
    warning: { color: '#facc15', label: 'Alerta' },
    saturated: { color: '#f87171', label: 'Saturado' },
  };
  const { color, label } = map[effectiveStatus] || map.active;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: `${color}18`, color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
      {label}
    </span>
  );
}

function OverlapBar({ percent }: { percent: number }) {
  const color = percent > 30 ? '#f87171' : percent > 15 ? '#facc15' : '#4ade80';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          width: `${percent}%`, height: '100%', borderRadius: 3, background: color,
          transition: 'width 0.4s ease', boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", color, minWidth: 36 }}>
        {percent}%
      </span>
    </div>
  );
}

export default function Audiences() {
  const isMobile = useIsMobile();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const overlappingPairs: { a: string; b: string; percent: number }[] = [];
  for (let i = 0; i < mockAudiences.length; i++) {
    for (let j = i + 1; j < mockAudiences.length; j++) {
      const avg = (mockAudiences[i].overlap_percent + mockAudiences[j].overlap_percent) / 2;
      if (avg > 30) {
        overlappingPairs.push({ a: mockAudiences[i].name, b: mockAudiences[j].name, percent: Math.round(avg) });
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99,102,241,0.3)',
          }}>
            <Users size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0', fontFamily: "'Outfit', sans-serif" }}>
              Audiencias
            </h2>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              {mockAudiences.length} audiencias ativas
            </span>
          </div>
        </div>
      </div>

      {/* Consolidation Banner */}
      {overlappingPairs.length > 0 && (
        <div style={{
          ...glassCard,
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          display: 'flex', alignItems: 'center', gap: 16, padding: 16,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'rgba(248,113,113,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Link2 size={18} color="#f87171" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f87171', marginBottom: 4 }}>
              Overlap Alto Detectado
            </div>
            {overlappingPairs.map((pair, i) => (
              <div key={i} style={{ fontSize: 12, color: '#e2e8f0', opacity: 0.8 }}>
                <strong>{pair.a}</strong> e <strong>{pair.b}</strong> com ~{pair.percent}% de overlap.
                Considere consolidar para evitar competicao no leilao.
              </div>
            ))}
          </div>
          <AlertTriangle size={20} color="#f87171" style={{ opacity: 0.6, flexShrink: 0 }} />
        </div>
      )}

      {/* Audience Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: isMobile ? 16 : 20,
      }}>
        {mockAudiences.map((aud) => (
          <div
            key={aud.id}
            style={{
              ...glassCard,
              padding: isMobile ? 16 : 24,
              borderColor: hoveredCard === aud.id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
              boxShadow: hoveredCard === aud.id ? '0 0 30px rgba(99,102,241,0.08), 0 8px 32px rgba(0,0,0,0.3)' : 'none',
              transform: hoveredCard === aud.id ? 'translateY(-2px)' : 'translateY(0)',
            }}
            onMouseEnter={() => setHoveredCard(aud.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>
                  {aud.name}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {formatNumber(aud.size)} pessoas
                </div>
              </div>
              <StatusBadge status={aud.status} frequency={aud.frequency} />
            </div>

            {/* Metrics Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12, marginBottom: 16,
            }}>
              <div>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>CPA</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {formatCurrency(aud.cpa)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>ROAS</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {aud.roas.toFixed(1)}x
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Freq.</div>
                <div style={{
                  fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
                  color: aud.frequency > 2.5 ? '#f87171' : '#e2e8f0',
                }}>
                  {aud.frequency.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Overlap */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Overlap
              </div>
              <OverlapBar percent={aud.overlap_percent} />
            </div>

            {/* Saturation Gauge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <SaturationGauge percent={aud.saturation_percent} />
              <div>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Saturacao
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {aud.saturation_percent < 40
                    ? 'Audiencia saudavel'
                    : aud.saturation_percent < 70
                    ? 'Monitorar de perto'
                    : 'Acao necessaria'}
                </div>
              </div>
            </div>
          </div>
        ))}
        {mockAudiences.length === 0 && (
          <div style={{ ...glassCard, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#64748b' }}>Nenhuma audiencia encontrada</div>
          </div>
        )}
      </div>
    </div>
  );
}
