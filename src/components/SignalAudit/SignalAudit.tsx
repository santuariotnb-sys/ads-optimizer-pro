import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import type { AuditZone, SignalAuditPillar } from '../../types/meta';

const ZONE_CONFIG: Record<AuditZone, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  green: { label: 'Pronto para Escalar', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)', icon: CheckCircle2 },
  yellow: { label: 'Atenção Necessária', color: '#facc15', bg: 'rgba(250, 204, 21, 0.1)', icon: AlertTriangle },
  red: { label: 'Conta Contaminada', color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)', icon: XCircle },
};

const glassCard: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.34)',
  backdropFilter: 'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  border: '1px solid rgba(255, 255, 255, 0.55)',
  borderRadius: 16,
  padding: 24,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

function ScoreGauge({ score, label, size = 120 }: { score: number; label: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score, 100) / 100;
  const offset = circumference * (1 - pct);
  const color = score >= 75 ? '#4ade80' : score >= 50 ? '#facc15' : '#f87171';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div style={{ position: 'relative', marginTop: -size + 8, height: size - 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: size * 0.3, fontWeight: 700, color }}>{score}%</span>
      </div>
      <span style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>{label}</span>
    </div>
  );
}

function PillarCard({ pillar, isExpanded, onToggle }: { pillar: SignalAuditPillar; isExpanded: boolean; onToggle: () => void }) {
  const zone = ZONE_CONFIG[pillar.zone];
  const maturityPct = (pillar.maturity / 5) * 100;
  const riskPct = (pillar.risk / 5) * 100;

  return (
    <div
      style={{ ...glassCard, padding: 20, cursor: 'pointer' }}
      onClick={onToggle}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: zone.color, boxShadow: `0 0 8px ${zone.color}40` }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{pillar.name}</span>
        </div>
        {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: isExpanded ? 16 : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>Maturidade</span>
            <span style={{ fontSize: 11, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace" }}>{pillar.maturity}/5</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.06)' }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${maturityPct}%`, background: '#4ade80', transition: 'width 0.5s ease' }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>Risco</span>
            <span style={{ fontSize: 11, color: riskPct > 40 ? '#f87171' : '#facc15', fontFamily: "'JetBrains Mono', monospace" }}>{pillar.risk}/5</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.06)' }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${riskPct}%`, background: riskPct > 40 ? '#f87171' : '#facc15', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12, borderTop: '1px solid rgba(15,23,42,0.08)' }}>
          {pillar.details.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: zone.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{d}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SignalAudit() {
  const isMobile = useIsMobile();
  const signalAudit = useStore((s) => s.signalAudit);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  if (!signalAudit) {
    return (
      <div style={{ padding: isMobile ? 16 : 32, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ ...glassCard, textAlign: 'center', maxWidth: 400 }}>
          <ShieldCheck size={48} color="#6366f1" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Signal Audit</h3>
          <p style={{ fontSize: 14, color: '#64748b' }}>Conecte sua conta Meta para executar a auditoria de sinais.</p>
        </div>
      </div>
    );
  }

  const zone = ZONE_CONFIG[signalAudit.zone];
  const ZoneIcon = zone.icon;
  const redLineCount = signalAudit.redLineChecks.filter(c => c.value).length;
  const isContaminated = redLineCount >= 3;

  return (
    <div style={{ padding: isMobile ? 16 : 32, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <ShieldCheck size={28} color="#6366f1" />
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
            META SIGNAL AUDIT
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Framework de auditoria de sinais — 8 pilares
          </p>
        </div>
      </div>

      {/* Score Overview */}
      <div style={{
        ...glassCard,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        gap: isMobile ? 24 : 48,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', gap: isMobile ? 24 : 40, alignItems: 'center' }}>
          <ScoreGauge score={signalAudit.overallMaturity} label="Maturidade" size={isMobile ? 100 : 130} />
          <ScoreGauge score={100 - signalAudit.overallRisk} label="Segurança" size={isMobile ? 100 : 130} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 12,
            background: zone.bg,
            border: `1px solid ${zone.color}30`,
            alignSelf: isMobile ? 'center' : 'flex-start',
          }}>
            <ZoneIcon size={18} color={zone.color} />
            <span style={{ fontSize: 14, fontWeight: 600, color: zone.color }}>{zone.label}</span>
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: 12, color: '#64748b' }}>Pilares Verdes</span>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80', fontFamily: "'Space Grotesk', sans-serif" }}>
                {signalAudit.pillars.filter(p => p.zone === 'green').length}/8
              </div>
            </div>
            <div>
              <span style={{ fontSize: 12, color: '#64748b' }}>Red Lines</span>
              <div style={{ fontSize: 20, fontWeight: 700, color: isContaminated ? '#f87171' : '#facc15', fontFamily: "'Space Grotesk', sans-serif" }}>
                {redLineCount}/5
              </div>
            </div>
            <div>
              <span style={{ fontSize: 12, color: '#64748b' }}>Status</span>
              <div style={{ fontSize: 14, fontWeight: 600, color: signalAudit.overallMaturity >= 75 ? '#4ade80' : '#facc15', marginTop: 4 }}>
                {signalAudit.overallMaturity >= 75 ? 'Pronto para escalar' : 'Otimizar antes de escalar'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Pillars Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        {signalAudit.pillars.map(pillar => (
          <PillarCard
            key={pillar.id}
            pillar={pillar}
            isExpanded={expandedPillar === pillar.id}
            onToggle={() => setExpandedPillar(expandedPillar === pillar.id ? null : pillar.id)}
          />
        ))}
      </div>

      {/* Red Line Checklist */}
      <div style={{ ...glassCard }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Activity size={18} color="#f87171" />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Checklist de Linha Vermelha
          </h3>
          {isContaminated && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#f87171',
              background: 'rgba(248, 113, 113, 0.1)', padding: '2px 8px', borderRadius: 6,
            }}>
              3+ SIM = CONTA CONTAMINADA
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {signalAudit.redLineChecks.map((check, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              borderRadius: 10, background: check.value ? 'rgba(248, 113, 113, 0.06)' : 'rgba(74, 222, 128, 0.04)',
              border: `1px solid ${check.value ? 'rgba(248, 113, 113, 0.15)' : 'rgba(74, 222, 128, 0.1)'}`,
            }}>
              {check.value
                ? <XCircle size={18} color="#f87171" />
                : <CheckCircle2 size={18} color="#4ade80" />
              }
              <span style={{ fontSize: 13, color: check.value ? '#f87171' : '#94a3b8' }}>
                {check.label}
              </span>
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                color: check.value ? '#f87171' : '#4ade80',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {check.value ? 'SIM' : 'NÃO'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
