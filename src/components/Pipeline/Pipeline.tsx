import { useState } from 'react';
import { Cpu, Brain, Gavel, Zap, ChevronRight, Server, ChevronDown } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

const stages = [
  {
    id: 'andromeda',
    title: 'Andromeda',
    subtitle: 'Retrieval Engine',
    color: '#6366f1',
    icon: Cpu,
    stats: '1B+ ads → ~1.000 em <200ms',
    details: [
      'Computer Vision — análise de thumbnails e vídeos',
      'NLP — processamento de texto e copy',
      'Audio Analysis — análise de áudio em vídeos',
      'Entity ID Clustering — tree hierárquica',
      'Similaridade >60% = suppression (mesmo ticket)',
    ],
    hardware: 'NVIDIA Grace Hopper + MTIA v2 (5nm, 7× sparse, 256MB SRAM)',
    metrics: [
      { label: 'Latência', value: '<200ms' },
      { label: 'Candidatos', value: '~1.000' },
      { label: 'Entity IDs', value: '5 ativos' },
    ],
  },
  {
    id: 'gem',
    title: 'GEM',
    subtitle: 'Ranking Model',
    color: '#8b5cf6',
    icon: Brain,
    stats: 'Maior foundation model de recomendação do mundo',
    details: [
      'Escala equivalente ao GPT-4',
      '+5% conversões Instagram',
      '+3% conversões Facebook Feed',
      'Cross-platform learning (IG↔FB)',
      'Ativo desde Q2 2025 — sem opt-in',
    ],
    hardware: 'Treinado em clusters MTIA v2 dedicados',
    metrics: [
      { label: 'IG Conv.', value: '+5%' },
      { label: 'FB Conv.', value: '+3%' },
      { label: 'Escala', value: 'GPT-4' },
    ],
  },
  {
    id: 'auction',
    title: 'Leilão',
    subtitle: 'Auction System',
    color: '#4ade80',
    icon: Gavel,
    stats: 'Valor = Lance × Taxa de Ação × Qualidade',
    details: [
      'U(C) = Σ(P(conv) × V) - C_ads',
      'First Conversion > All Conversions',
      'Advantage+ Sales: +22% ROAS',
      'Broad targeting otimizado pelo Andromeda',
      'CBO para distribuição automática de budget',
    ],
    hardware: 'Real-time bidding em milhões de impressões/segundo',
    metrics: [
      { label: 'ASC ROAS', value: '+22%' },
      { label: 'Bid Type', value: 'Auto' },
      { label: 'Velocidade', value: 'Real-time' },
    ],
  },
];

const animationKeyframes = `
@keyframes flowDot {
  0% { transform: translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

@keyframes slideDown {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 400px; }
}
`;

const containerStyle: React.CSSProperties = {
  padding: '32px 24px',
  background: 'rgba(255,255,255,.34)',
  backdropFilter: 'blur(28px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,.55)',
  boxShadow: '0 30px 120px -45px rgba(15,23,42,.26), 0 10px 30px -18px rgba(255,255,255,.82), inset 0 1px 0 rgba(255,255,255,.92)',
};

const titleSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 40,
};

const pipelineRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 0,
  position: 'relative',
};

function getCardStyle(color: string, isHovered: boolean, isExpanded: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '28px 24px',
    borderRadius: 20,
    background: 'rgba(255,255,255,.34)',
    backdropFilter: 'blur(28px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
    border: `1px solid ${isHovered || isExpanded ? color + '55' : 'rgba(255,255,255,.55)'}`,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    transform: isHovered ? 'translateY(-4px)' : 'none',
    boxShadow: isHovered || isExpanded
      ? `0 8px 32px ${color}22, 0 0 60px ${color}11, inset 0 1px 0 ${color}15`
      : '0 30px 120px -45px rgba(15,23,42,.26), inset 0 1px 0 rgba(255,255,255,.92)',
  };
}

function getIconContainerStyle(color: string): React.CSSProperties {
  return {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: `${color}15`,
    border: `1px solid ${color}30`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  };
}

function getGlowStyle(color: string): React.CSSProperties {
  return {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    height: 3,
    background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
    borderRadius: '16px 16px 0 0',
    opacity: 0.6,
  };
}

const connectorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 60,
  position: 'relative',
  flexShrink: 0,
};

const connectorLineStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: 2,
  background: 'linear-gradient(90deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
  transform: 'translateY(-50%)',
};

function getFlowDotStyle(delay: number, color: string): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: color,
    boxShadow: `0 0 12px ${color}`,
    transform: 'translateY(-50%)',
    animation: `flowDot 2s ease-in-out ${delay}s infinite`,
  };
}

const metricBoxStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  background: 'rgba(15,23,42,0.03)',
  border: '1px solid rgba(15,23,42,0.08)',
  textAlign: 'center',
};

const detailItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  padding: '6px 0',
  fontSize: 13,
  color: '#94a3b8',
  lineHeight: 1.5,
};

export default function Pipeline() {
  const isMobile = useIsMobile();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const toggleCard = (id: string) => {
    setExpandedCard((prev) => (prev === id ? null : id));
  };

  return (
    <div className="tilt-card" style={{ ...containerStyle, padding: isMobile ? '20px 16px' : '32px 24px' }}>
      <style>{animationKeyframes}</style>

      {/* Title */}
      <div style={{ ...titleSectionStyle, marginBottom: isMobile ? 24 : 40 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.02em',
          }}
        >
          Flow Builder
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#64748b' }}>
          Como o Meta processa seus anúncios: do Andromeda ao Leilão
        </p>
      </div>

      {/* Pipeline Row */}
      <div style={{ ...pipelineRowStyle, flexDirection: isMobile ? 'column' : 'row' }}>
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isHovered = hoveredCard === stage.id;
          const isExpanded = expandedCard === stage.id;

          return (
            <div key={stage.id} style={{ display: 'contents' }}>
              {/* Stage Card */}
              <div
                style={{ ...getCardStyle(stage.color, isHovered, isExpanded), flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : undefined, padding: isMobile ? '20px 16px' : '28px 24px' }}
                onClick={() => toggleCard(stage.id)}
                onMouseEnter={() => setHoveredCard(stage.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Top glow bar */}
                <div style={getGlowStyle(stage.color)} />

                {/* Pulsing background glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${stage.color}08 0%, transparent 70%)`,
                    transform: 'translate(-50%, -50%)',
                    animation: 'pulseGlow 3s ease-in-out infinite',
                    pointerEvents: 'none',
                  }}
                />

                {/* Step number */}
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: `${stage.color}12`,
                    border: `1px solid ${stage.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: stage.color,
                  }}
                >
                  {index + 1}
                </div>

                {/* Icon */}
                <div style={getIconContainerStyle(stage.color)}>
                  <Icon size={22} color={stage.color} />
                </div>

                {/* Title */}
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {stage.title}
                </h3>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    color: stage.color,
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}
                >
                  {stage.subtitle}
                </p>

                {/* Stats */}
                <p
                  style={{
                    margin: '14px 0 0',
                    fontSize: 13,
                    color: '#94a3b8',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                  }}
                >
                  {stage.stats}
                </p>

                {/* Metrics row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    marginTop: 16,
                  }}
                >
                  {stage.metrics.map((m) => (
                    <div key={m.label} style={metricBoxStyle}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: stage.color,
                          marginBottom: 2,
                          fontFamily: "'Outfit', sans-serif",
                        }}
                      >
                        {m.value}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expand indicator */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 14,
                    gap: 6,
                    color: '#64748b',
                    fontSize: 12,
                  }}
                >
                  <span>{isExpanded ? 'Menos detalhes' : 'Mais detalhes'}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: `1px solid ${stage.color}20`,
                      animation: 'slideDown 0.3s ease forwards',
                      overflow: 'hidden',
                    }}
                  >
                    {stage.details.map((detail, i) => (
                      <div key={i} style={detailItemStyle}>
                        <Zap
                          size={12}
                          color={stage.color}
                          style={{ flexShrink: 0, marginTop: 3 }}
                        />
                        <span>{detail}</span>
                      </div>
                    ))}

                    {/* Hardware section */}
                    <div
                      style={{
                        marginTop: 12,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: `${stage.color}08`,
                        border: `1px solid ${stage.color}15`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}
                    >
                      <Server
                        size={14}
                        color={stage.color}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                        {stage.hardware}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Connector between cards */}
              {index < stages.length - 1 && (
                isMobile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 40, position: 'relative', justifyContent: 'center' }}>
                    <div style={{ width: 2, height: '100%', background: 'linear-gradient(180deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))' }} />
                    <ChevronDown size={20} color="rgba(99,102,241,0.6)" style={{ position: 'absolute', zIndex: 1 }} />
                  </div>
                ) : (
                  <div style={connectorStyle}>
                    <div style={connectorLineStyle} />
                    {[0, 0.6, 1.2].map((delay, di) => (
                      <div
                        key={di}
                        style={getFlowDotStyle(
                          delay,
                          index === 0 ? '#6366f1' : '#8b5cf6'
                        )}
                      />
                    ))}
                    <ChevronRight
                      size={20}
                      color="rgba(99,102,241,0.6)"
                      style={{ position: 'relative', zIndex: 1 }}
                    />
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 32,
          flexWrap: 'wrap',
        }}
      >
        {stages.map((stage) => (
          <div
            key={stage.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: '#64748b',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: stage.color,
                boxShadow: `0 0 8px ${stage.color}60`,
              }}
            />
            <span>{stage.title}</span>
            <span style={{ color: '#475569' }}>—</span>
            <span style={{ color: '#475569' }}>{stage.subtitle}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
