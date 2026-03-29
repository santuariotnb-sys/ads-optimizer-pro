import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  Target,
  ChevronRight,
  Plus,
  FileText,
  Shield,
  Zap,
} from 'lucide-react';
import AlpineCard from '../Layout/AlpineCard';
import Tooltip from '../ui/Tooltip';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { formatCurrency, formatNumber, getStatusColor } from '../../utils/formatters';
import { mockCampaigns, mockDashboardMetrics } from '../../data/mockData';

/* ────────────────────────── helpers ────────────────────────── */

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(target: number, duration = 1600, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, decimals]);

  return value;
}

/* ────────────────────── label / value styles ────────────────── */

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: '#64748b',
  margin: 0,
};

const bigValueStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 600,
  letterSpacing: '-.04em',
  color: '#0f172a',
  fontVariantNumeric: 'tabular-nums',
  fontFamily: "'Space Grotesk', sans-serif",
  margin: '6px 0 0',
};

const deltaBadge: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(100,116,139,.9), rgba(71,85,105,.95), rgba(24,34,53,.95))',
  color: '#fff',
  fontSize: 11,
  borderRadius: 20,
  padding: '3px 10px',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
};

const progressTrack: React.CSSProperties = {
  height: 6,
  borderRadius: 20,
  background: 'rgba(203,213,225,.7)',
  marginTop: 12,
  overflow: 'hidden',
};

function ProgressBar({ percent, delay = 0, gradient }: { percent: number; delay?: number; gradient?: string }) {
  return (
    <div style={progressTrack}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 1.2, delay: delay / 1000, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          height: '100%',
          borderRadius: 20,
          background: gradient || 'linear-gradient(90deg, #78716c, #1e293b)',
          boxShadow: '0 1px 6px rgba(30,41,59,.3)',
        }}
      />
    </div>
  );
}

/* ────────────────────── KPI Card ────────────────────── */

interface KPIProps {
  label: React.ReactNode;
  value: string;
  delta: number;
  barPercent: number;
  barGradient?: string;
  invertDelta?: boolean;
  icon: React.ReactNode;
  delay: number;
}

function KPICard({ label, value, delta, barPercent, barGradient, invertDelta, icon, delay }: KPIProps) {
  const isGood = invertDelta ? delta < 0 : delta > 0;
  return (
    <AlpineCard delay={delay} padding={20}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={labelStyle}>{label}</p>
        <span style={{ color: '#94a3b8', opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={bigValueStyle}>{value}</span>
        <span style={deltaBadge}>
          {isGood ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {delta > 0 ? '+' : ''}{delta}%
        </span>
      </div>
      <ProgressBar percent={barPercent} delay={delay + 300} gradient={barGradient} />
    </AlpineCard>
  );
}

/* ────────────────────── Signal Chart (inline SVG) ────────────────────── */

const signalData = [72, 78, 74, 81, 85, 83, 87];
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

function SignalChart() {
  const w = 280;
  const h = 120;
  const padX = 10;
  const padY = 10;
  const max = Math.max(...signalData);
  const min = Math.min(...signalData) - 5;

  const points = signalData.map((v, i) => {
    const x = padX + (i / (signalData.length - 1)) * (w - padX * 2);
    const y = padY + ((max - v) / (max - min)) * (h - padY * 2);
    return { x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h + 20}`} width="100%" style={{ display: 'block' }}>
        {/* grid lines */}
        {[0.25, 0.5, 0.75].map((r) => (
          <line
            key={r}
            x1={padX}
            y1={padY + r * (h - padY * 2)}
            x2={w - padX}
            y2={padY + r * (h - padY * 2)}
            stroke="rgba(148,163,184,.2)"
            strokeDasharray="4 4"
          />
        ))}
        {/* area fill */}
        <defs>
          <linearGradient id="sigFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#78716c" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="sigLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#78716c" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sigFill)" />
        <path d={line} fill="none" stroke="url(#sigLine)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#fff" stroke="#1e293b" strokeWidth={2} />
        ))}
        {/* labels */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={h + 16} textAnchor="middle" fontSize={9} fill="#94a3b8" fontFamily="Outfit">
            {days[i]}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ────────────────────── Weekly Bar Chart ────────────────────── */

const weeklySpend = [1420, 1890, 1650, 2100, 1980, 1240, 1200];

function WeeklyChart() {
  const max = Math.max(...weeklySpend);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110, padding: '0 4px' }}>
      {weeklySpend.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 90}px` }}
            transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              width: '100%',
              borderRadius: 8,
              background: 'linear-gradient(180deg, rgba(255,255,255,.45), rgba(255,255,255,.2))',
              border: '1px solid rgba(255,255,255,.5)',
              backdropFilter: 'blur(6px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ duration: 1, delay: 0.1 * i + 0.3 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(180deg, #78716c, #1e293b)',
                borderRadius: 8,
                opacity: 0.85,
              }}
            />
          </motion.div>
          <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500 }}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────── Gauge SVG ────────────────────── */

function AccountGauge({ score }: { score: number }) {
  const animatedScore = useCountUp(score, 1600, 0);
  const r = 70;
  const stroke = 10;
  const circumference = Math.PI * r; // semicircle
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={180} height={110} viewBox="0 0 180 110">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        {/* track */}
        <path
          d={`M ${90 - r} 95 A ${r} ${r} 0 0 1 ${90 + r} 95`}
          fill="none"
          stroke="rgba(203,213,225,.5)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* fill */}
        <motion.path
          d={`M ${90 - r} 95 A ${r} ${r} 0 0 1 ${90 + r} 95`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        <text x={90} y={80} textAnchor="middle" fontSize={32} fontWeight={700} fill="#0f172a" fontFamily="Space Grotesk">
          {animatedScore}%
        </text>
        <text x={90} y={100} textAnchor="middle" fontSize={10} fill="#64748b" fontFamily="Outfit">
          Pontuação
        </text>
      </svg>
    </div>
  );
}

/* ────────────────────── Status Badge ────────────────────── */

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 12,
        background: `${getStatusColor(status)}22`,
        color: getStatusColor(status),
        textTransform: 'uppercase',
        letterSpacing: '.06em',
      }}
    >
      {status}
    </span>
  );
}

/* ════════════════════════ MAIN COMPONENT ════════════════════════ */

export default function Overview() {
  const isMobile = useIsMobile();
  const campaigns = useStore((s) => s.campaigns);
  const metrics = useStore((s) => s.metrics);
  const emqScore = useStore((s) => s.emqScore);
  const setCurrentModule = useStore((s) => s.setCurrentModule);

  const liveCampaigns = campaigns.length > 0 ? campaigns : mockCampaigns;
  const topCampaigns = [...liveCampaigns]
    .filter((c) => c.status !== 'DELETED')
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 4);

  const cpa = metrics.cpa || mockDashboardMetrics.cpa;
  const roas = metrics.roas || mockDashboardMetrics.roas;
  const spend = metrics.spend || mockDashboardMetrics.spend;
  const conversions = metrics.conversions || mockDashboardMetrics.conversions;
  const accountScore = metrics.accountScore || mockDashboardMetrics.accountScore;
  const emq = emqScore || 8.7;

  const animatedCPA = useCountUp(cpa, 1600, 2);
  const animatedROAS = useCountUp(roas, 1600, 1);
  const animatedSpend = useCountUp(spend, 1600, 0);
  const animatedConversions = useCountUp(conversions, 1600, 0);

  const activeCampaigns = liveCampaigns.filter((c) => c.status === 'ACTIVE').length;

  /* ── Quick Actions ── */
  const actions = [
    { label: 'Criar Campanha', icon: <Plus size={14} />, module: 'create', num: 1 },
    { label: 'Gerar Relatório', icon: <FileText size={14} />, module: 'opt-financial', num: 2 },
    { label: 'Auditoria de Sinal', icon: <Shield size={14} />, module: 'opt-audit', num: 3 },
    { label: 'Escalar Vencedoras', icon: <Zap size={14} />, module: 'opt-scale', num: 4 },
  ];

  const navigate = useCallback((mod: string) => setCurrentModule(mod), [setCurrentModule]);

  /* ════════════════════════ RENDER ════════════════════════ */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── ROW 1: KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 16 }}>
        <KPICard
          label={<Tooltip text="Quanto você paga por cada conversão">Custo por Aquisição</Tooltip>}
          value={formatCurrency(animatedCPA)}
          delta={-12.4}
          barPercent={78}
          invertDelta
          icon={<DollarSign size={16} />}
          delay={0}
        />
        <KPICard
          label={<Tooltip text="Retorno sobre Investimento: receita ÷ gasto">ROI</Tooltip>}
          value={`${animatedROAS.toFixed(1)}x`}
          delta={18.6}
          barPercent={84}
          barGradient="linear-gradient(90deg, #ef4444, #f59e0b, #10b981)"
          icon={<TrendingUp size={16} />}
          delay={60}
        />
        <KPICard
          label="Total Investido"
          value={formatCurrency(animatedSpend)}
          delta={8.2}
          barPercent={62}
          icon={<DollarSign size={16} />}
          delay={120}
        />
        <KPICard
          label="Total Conversões"
          value={formatNumber(animatedConversions)}
          delta={22.1}
          barPercent={91}
          icon={<Target size={16} />}
          delay={180}
        />
      </div>

      {/* ── ROW 2: Signal + Gauge ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.25fr 0.75fr',
          gap: 16,
        }}
      >
        {/* Signal Overview */}
        <AlpineCard delay={240} padding={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={labelStyle}>Qualidade do Sinal</p>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: '4px 0 0' }}>Ads.Everest</p>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: '#4ade80',
                background: 'rgba(74,222,128,.1)',
                padding: '4px 12px',
                borderRadius: 20,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
              Ao Vivo
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
              gap: 20,
              alignItems: 'start',
            }}
          >
            <SignalChart />

            {/* Core Metrics sub-card */}
            <div
              style={{
                background: 'rgba(255,255,255,.25)',
                backdropFilter: 'blur(12px)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,.4)',
                padding: 16,
                minWidth: 140,
              }}
            >
              <p style={{ ...labelStyle, marginBottom: 12 }}>Métricas Principais</p>
              {[
                { label: 'Score EMQ', value: emq.toFixed(1), tip: 'Event Match Quality — qualidade do sinal enviado ao Meta (0-10)' },
                { label: 'Taxa de Match', value: '89%', tip: '% de eventos com identidade do usuário reconhecida pelo Meta' },
                { label: 'Recuperação', value: '+34%', tip: 'Eventos capturados pelo Gateway que o Pixel perdeu' },
              ].map((m) => (
                <div key={m.label} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                    <Tooltip text={m.tip}>{m.label}</Tooltip>
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '2px 0 0', fontFamily: "'Space Grotesk'" }}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </AlpineCard>

        {/* Account Score Gauge */}
        <AlpineCard delay={300} padding={24}>
          <p style={{ ...labelStyle, marginBottom: 4 }}>
            <Tooltip text="Saúde geral da sua conta baseada em métricas chave">Pontuação da Conta</Tooltip>
          </p>
          <AccountGauge score={accountScore} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            {[
              { label: 'Tendência CPA', value: '-12%', color: '#4ade80' },
              { label: 'CTR Médio', value: '2.1%', color: '#60a5fa' },
              { label: 'Saúde da Conta', value: 'Bom', color: '#facc15' },
              { label: 'Fase de Aprendizado', value: '2/6', color: '#94a3b8' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: 'rgba(255,255,255,.2)',
                  borderRadius: 10,
                  padding: '8px 10px',
                  border: '1px solid rgba(255,255,255,.3)',
                }}
              >
                <p style={{ fontSize: 9, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, color: s.color, margin: '2px 0 0', fontFamily: "'Space Grotesk'" }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </AlpineCard>
      </div>

      {/* ── ROW 3: Campaigns + Weekly + Quick Actions ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.05fr 0.95fr 0.7fr',
          gap: 16,
        }}
      >
        {/* Campaigns mini list */}
        <AlpineCard delay={360} padding={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <p style={labelStyle}>Campanhas</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '2px 0 0' }}>Melhores Campanhas</p>
            </div>
            <button
              onClick={() => navigate('opt-campaigns')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 11,
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                fontWeight: 500,
              }}
            >
              Ver todas <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topCampaigns.map((c) => {
              const budgetUsed = c.daily_budget > 0 ? Math.min((c.spend / (c.daily_budget * 30)) * 100, 100) : 0;
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,.15)',
                    border: '1px solid rgba(255,255,255,.25)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', fontFamily: "'Space Grotesk'" }}>
                      {c.roas.toFixed(2)}x ROAS
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{formatCurrency(c.spend)}</span>
                  </div>
                  <ProgressBar percent={budgetUsed} delay={400} />
                </div>
              );
            })}
          </div>
        </AlpineCard>

        {/* Weekly Spend Chart */}
        <AlpineCard delay={420} padding={20}>
          <p style={labelStyle}>Investimento Semanal</p>
          <div style={{ marginTop: 12 }}>
            <WeeklyChart />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 10, marginTop: 16 }}>
            {[
              { label: 'Campanhas Ativas', value: String(activeCampaigns) },
              { label: 'Conversões', value: String(Math.round(conversions)) },
              { label: 'Variação', value: '+22%' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: 'rgba(255,255,255,.2)',
                  borderRadius: 10,
                  padding: '8px 10px',
                  border: '1px solid rgba(255,255,255,.3)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 9, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '2px 0 0', fontFamily: "'Space Grotesk'" }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </AlpineCard>

        {/* Quick Actions */}
        <AlpineCard delay={480} padding={20}>
          <p style={labelStyle}>Ações Rápidas</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {actions.map((a) => (
              <motion.button
                key={a.module}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(a.module)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,.4)',
                  background: 'rgba(255,255,255,.2)',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #78716c, #1e293b)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {a.icon}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.label}</span>
                <ChevronRight size={14} color="#94a3b8" />
              </motion.button>
            ))}
          </div>
        </AlpineCard>
      </div>

      {/* Pulse animation keyframes (injected once) */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }
      `}</style>
    </div>
  );
}
