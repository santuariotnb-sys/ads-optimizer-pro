import { useState, useMemo } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { mockCreativesData } from '../../data/mockData';
import { formatCurrency, getScoreColor } from '../../utils/formatters';
import { Trophy, FlaskConical, XCircle, TrendingUp, TrendingDown, Clock, AlertTriangle, Layers } from 'lucide-react';
import type { Creative, CreativeStatus } from '../../types/meta';
import EntityIDMap from './EntityIDMap';

const COLORS = {
  bg: 'rgba(255, 255, 255, 0.34)',
  surface: 'rgba(255, 255, 255, 0.34)',
  surfaceHover: 'rgba(255, 255, 255, 0.55)',
  border: 'rgba(15, 23, 42, 0.08)',
  borderHover: 'rgba(15, 23, 42, 0.14)',
  text: '#0f172a',
  textMuted: '#64748b',
  accent: '#6366f1',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#6366f1',
  info: '#60a5fa',
};

type Filter = 'all' | 'winner' | 'testing' | 'loser';
type SortKey = 'score' | 'cpa' | 'hook_rate';

const statusConfig: Record<CreativeStatus, { label: string; color: string; icon: typeof Trophy; bgAlpha: string }> = {
  winner: { label: 'Vencedor', color: COLORS.success, icon: Trophy, bgAlpha: 'rgba(74, 222, 128, 0.1)' },
  testing: { label: 'Testando', color: COLORS.info, icon: FlaskConical, bgAlpha: 'rgba(96, 165, 250, 0.1)' },
  loser: { label: 'Perdedor', color: COLORS.danger, icon: XCircle, bgAlpha: 'rgba(248, 113, 113, 0.1)' },
};

const formatIcons: Record<string, string> = {
  VSL: '🎬', Reels: '🎬', Carrossel: '🎠', Estático: '🖼️', Story: '📱', UGC: '🎤', Meme: '😂',
  Comparativo: '↔️', Infográfico: '📊',
};

function getFormatIcon(name: string): string {
  for (const [key, icon] of Object.entries(formatIcons)) {
    if (name.includes(key)) return icon;
  }
  return '🎨';
}

function getFormatGradient(name: string): string {
  if (name.includes('VSL') || name.includes('Reels')) return 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
  if (name.includes('Carrossel')) return 'linear-gradient(135deg, #f97316 0%, #4f46e5 100%)';
  if (name.includes('UGC')) return 'linear-gradient(135deg, #60a5fa 0%, #4ade80 100%)';
  if (name.includes('Story')) return 'linear-gradient(135deg, #6366f1 0%, #f97316 100%)';
  return 'linear-gradient(135deg, #475569 0%, #a3a3a3 100%)';
}

function hasFatigue(creative: Creative): boolean {
  const t = creative.cpm_trend;
  if (t.length < 4) return false;
  const recent = t[t.length - 1];
  const threeAgo = t[t.length - 3];
  return threeAgo > 0 && ((recent - threeAgo) / threeAgo) * 100 > 30;
}

function MiniCPMChart({ trend, fatigue }: { trend: number[]; fatigue: boolean }) {
  if (trend.length < 2) return null;
  const min = Math.min(...trend);
  const max = Math.max(...trend);
  const range = max - min || 1;
  const h = 24;
  const w = 60;
  const points = trend.map((v, i) =>
    `${(i / (trend.length - 1)) * w},${h - ((v - min) / range) * h}`
  ).join(' ');

  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={points} fill="none"
        stroke={fatigue ? COLORS.danger : COLORS.textMuted}
        strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const color = getScoreColor(score);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 44, height: 44 }}>
      <svg width={44} height={44} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={22} cy={22} r={radius} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth={3} />
        <circle cx={22} cy={22} r={radius} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color, fontFamily: "'Outfit', sans-serif",
      }}>
        {score}
      </div>
    </div>
  );
}

function CreativeCard({ creative, isMobile }: { creative: Creative; isMobile: boolean }) {
  const [hovered, setHovered] = useState(false);
  const config = statusConfig[creative.status];
  const StatusIcon = config.icon;
  const fatigue = hasFatigue(creative);
  const isWinner = creative.status === 'winner';
  const isLoser = creative.status === 'loser';

  const metrics = [
    { label: 'Hook Rate', value: `${creative.hook_rate.toFixed(1)}%` },
    { label: 'Hold Rate', value: `${creative.hold_rate.toFixed(1)}%` },
    { label: 'CTR', value: `${creative.ctr.toFixed(1)}%` },
    { label: 'CPA', value: formatCurrency(creative.cpa) },
    { label: 'CPM', value: formatCurrency(creative.cpm) },
  ];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? COLORS.surfaceHover : COLORS.surface,
        border: fatigue
          ? '2px solid rgba(248, 113, 113, 0.6)'
          : `1px solid ${hovered ? COLORS.borderHover : COLORS.border}`,
        borderRadius: 20,
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        opacity: isLoser ? 0.6 : 1,
        boxShadow: isWinner
          ? `0 0 20px rgba(16, 185, 129, 0.08), inset 0 1px 0 rgba(16, 185, 129, 0.1)`
          : fatigue
            ? '0 0 16px rgba(239, 68, 68, 0.12)'
            : '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06), 0 12px 40px rgba(15,23,42,0.04)',
        animation: fatigue ? 'fatiguePulse 2s ease-in-out infinite' : 'none',
        position: 'relative',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 100,
        background: getFormatGradient(creative.name),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <span style={{ fontSize: 32 }}>{getFormatIcon(creative.name)}</span>

        {/* Entity ID badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(8px)',
          borderRadius: 6, padding: '3px 8px',
          fontSize: 10, fontWeight: 600, color: COLORS.text,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Layers size={10} />
          Entity #{creative.entity_id_group}
        </div>

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: config.bgAlpha,
          border: `1px solid ${config.color}44`,
          backdropFilter: 'blur(8px)',
          borderRadius: 6, padding: '3px 8px',
          fontSize: 10, fontWeight: 600, color: config.color,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <StatusIcon size={10} />
          {config.label}
        </div>

        {/* Fatigue warning */}
        {fatigue && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(248, 113, 113, 0.2)',
            border: '1px solid rgba(248, 113, 113, 0.4)',
            borderRadius: 6, padding: '3px 8px',
            fontSize: 9, fontWeight: 600, color: COLORS.danger,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <AlertTriangle size={10} />
            Fadiga
          </div>
        )}
      </div>

      <div style={{ padding: isMobile ? 10 : 14 }}>
        {/* Name + Score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{
            color: COLORS.text, fontSize: 13, fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: 'calc(100% - 54px)',
          }}>
            {creative.name}
          </div>
          <ScoreGauge score={creative.score} />
        </div>

        {/* Metrics grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: 6, marginBottom: 10,
        }}>
          {metrics.map(m => (
            <div key={m.label} style={{
              background: 'rgba(15, 23, 42, 0.04)',
              borderRadius: 6, padding: '5px 7px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, fontFamily: "'Outfit', sans-serif" }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Novelty + CPM trend */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: `1px solid ${COLORS.border}`, paddingTop: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} color={COLORS.textMuted} />
            <span style={{
              fontSize: 11, color: creative.novelty_days > 7 ? COLORS.warning : COLORS.textMuted,
              fontWeight: creative.novelty_days > 7 ? 600 : 400,
            }}>
              {creative.novelty_days}d ativo
            </span>
            {creative.cpm_trend[creative.cpm_trend.length - 1] > creative.cpm_trend[0]
              ? <TrendingUp size={12} color={COLORS.danger} />
              : <TrendingDown size={12} color={COLORS.success} />}
          </div>
          <MiniCPMChart trend={creative.cpm_trend} fatigue={fatigue} />
        </div>
      </div>
    </div>
  );
}

export default function Creatives() {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<Filter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('score');

  const filtered = useMemo(() => {
    let result = [...mockCreativesData];
    if (filter !== 'all') result = result.filter(c => c.status === filter);
    result.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'cpa') return a.cpa - b.cpa;
      return b.hook_rate - a.hook_rate;
    });
    return result;
  }, [filter, sortBy]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: mockCreativesData.length },
    { key: 'winner', label: 'Vencedores', count: mockCreativesData.filter(c => c.status === 'winner').length },
    { key: 'testing', label: 'Testando', count: mockCreativesData.filter(c => c.status === 'testing').length },
    { key: 'loser', label: 'Perdedores', count: mockCreativesData.filter(c => c.status === 'loser').length },
  ];

  const sorts: { key: SortKey; label: string }[] = [
    { key: 'score', label: 'Score' },
    { key: 'cpa', label: 'CPA' },
    { key: 'hook_rate', label: 'Hook Rate' },
  ];

  return (
    <div>
      {/* Fatigue keyframe */}
      <style>{`
        @keyframes fatiguePulse {
          0%, 100% { border-color: rgba(99, 102, 241, 0.6); }
          50% { border-color: rgba(99, 102, 241, 0.2); }
        }
      `}</style>

      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: COLORS.text, fontSize: 24, fontWeight: 700, margin: 0 }}>Criativos</h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, margin: '4px 0 0' }}>
          Analise performance, fadiga e Entity IDs dos seus criativos
        </p>
      </div>

      {/* Entity ID Map */}
      <EntityIDMap />

      {/* Filters + Sort */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 8, overflowX: isMobile ? 'auto' : undefined, WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], flexShrink: 0 }}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.5)',
                border: `1px solid ${filter === f.key ? 'rgba(99, 102, 241, 0.4)' : COLORS.border}`,
                borderRadius: 8,
                padding: '6px 14px',
                color: filter === f.key ? COLORS.accent : COLORS.textMuted,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {f.label}
              <span style={{
                background: filter === f.key ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15,23,42,0.06)',
                borderRadius: 4,
                padding: '1px 6px',
                fontSize: 11,
              }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>Ordenar:</span>
          {sorts.map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              style={{
                background: sortBy === s.key ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: `1px solid ${sortBy === s.key ? 'rgba(99, 102, 241, 0.3)' : COLORS.border}`,
                borderRadius: 6,
                padding: isMobile ? '8px 12px' : '4px 10px',
                color: sortBy === s.key ? COLORS.accent : COLORS.textMuted,
                fontSize: 12,
                minHeight: isMobile ? 36 : undefined,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Creative Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: isMobile ? 12 : 16,
      }}>
        {filtered.map(creative => (
          <CreativeCard key={creative.id} creative={creative} isMobile={isMobile} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.34)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255, 255, 255, 0.55)',
            borderRadius: 20,
            padding: 40,
            textAlign: 'center',
            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)',
          }}
        >
          <div style={{ fontSize: 14, color: '#64748b' }}>Nenhum criativo encontrado</div>
        </div>
      )}
    </div>
  );
}
