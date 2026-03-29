import { useState, useRef, useCallback } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { showToast } from '../ui/toastStore';

// ── Types ──────────────────────────────────────────────────────────────────

type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'LEARNING';

interface CampanhaRow {
  status: CampaignStatus;
  campanha: string;
  orcamento: number;
  vendas: number;
  cpa: number;
  gastos: number;
  faturamento: number;
  lucro: number;
  roas: number;
  margem: number;
  roi: number;
  ctr: number;
  cpm: number;
  impressoes: number;
  cliques: number;
}

interface UTMRow {
  utm_campaign: string;
  vendas: number;
  cpa: number;
  gastos: number;
  faturamento: number;
  lucro: number;
  roas: number;
  margem: number;
  roi: number;
  cpi: number;
  cpc: number;
  ctr: number;
  cpm: number;
  impressoes: number;
  cliques: number;
}

interface VendaRow {
  data: string;
  produto: string;
  cliente: string;
  valor: number;
  status: string;
  plataforma: string;
  utm_source: string;
  utm_campaign: string;
}

interface RelatorioRow {
  data: string;
  dia: string;
  vendas: number;
  cpa: number;
  gastos: number;
  faturamento: number;
  lucro: number;
  roas: number;
  margem: number;
  roi: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const CAMPANHAS_DATA: CampanhaRow[] = [
  { status: 'ACTIVE', campanha: '[RETARGET] Carrinho Abandonado 7d', orcamento: 150, vendas: 48, cpa: 28.40, gastos: 1363.20, faturamento: 7104, lucro: 5740.80, roas: 5.21, margem: 80.8, roi: 421, ctr: 3.8, cpm: 65.20, impressoes: 20900, cliques: 794 },
  { status: 'ACTIVE', campanha: '[ASC] Protocolo Detox — Broad', orcamento: 500, vendas: 93, cpa: 42.50, gastos: 3952.50, faturamento: 15111, lucro: 11158.50, roas: 3.82, margem: 73.8, roi: 282, ctr: 2.1, cpm: 38.90, impressoes: 101600, cliques: 2134 },
  { status: 'ACTIVE', campanha: '[CBO] Kit Skincare — Lookalike 1%', orcamento: 350, vendas: 50, cpa: 58.30, gastos: 2915, faturamento: 8568, lucro: 5653, roas: 2.94, margem: 66.0, roi: 194, ctr: 1.7, cpm: 42.10, impressoes: 69200, cliques: 1176 },
  { status: 'LEARNING', campanha: '[ASC] Suplemento Whey — Performance', orcamento: 200, vendas: 12, cpa: 89.00, gastos: 1068, faturamento: 1548.60, lucro: 480.60, roas: 1.45, margem: 31.0, roi: 45, ctr: 1.2, cpm: 52.30, impressoes: 20420, cliques: 245 },
  { status: 'ACTIVE', campanha: '[ASC] Black Friday — Multi-Produto', orcamento: 800, vendas: 70, cpa: 72.00, gastos: 5040, faturamento: 9676.80, lucro: 4636.80, roas: 1.92, margem: 47.9, roi: 92, ctr: 1.5, cpm: 44.80, impressoes: 112500, cliques: 1688 },
  { status: 'PAUSED', campanha: '[CBO] Colageno Premium — Interesses', orcamento: 250, vendas: 13, cpa: 145.00, gastos: 1885, faturamento: 1545.70, lucro: -339.30, roas: 0.82, margem: -22.0, roi: -18, ctr: 0.8, cpm: 48.60, impressoes: 38780, cliques: 310 },
  { status: 'ACTIVE', campanha: '[CBO] Emagrecedor Natural — LAL 2%', orcamento: 280, vendas: 38, cpa: 51.20, gastos: 1945.60, faturamento: 5814, lucro: 3868.40, roas: 2.99, margem: 66.5, roi: 199, ctr: 2.3, cpm: 40.10, impressoes: 48520, cliques: 1116 },
];

const UTM_DATA: UTMRow[] = [
  { utm_campaign: 'retarget_carrinho_7d', vendas: 48, cpa: 28.40, gastos: 1363.20, faturamento: 7104, lucro: 5740.80, roas: 5.21, margem: 80.8, roi: 421, cpi: 0.065, cpc: 1.72, ctr: 3.8, cpm: 65.20, impressoes: 20900, cliques: 794 },
  { utm_campaign: 'protocolo_detox_broad', vendas: 93, cpa: 42.50, gastos: 3952.50, faturamento: 15111, lucro: 11158.50, roas: 3.82, margem: 73.8, roi: 282, cpi: 0.039, cpc: 1.85, ctr: 2.1, cpm: 38.90, impressoes: 101600, cliques: 2134 },
  { utm_campaign: 'kit_skincare_lal1', vendas: 50, cpa: 58.30, gastos: 2915, faturamento: 8568, lucro: 5653, roas: 2.94, margem: 66.0, roi: 194, cpi: 0.042, cpc: 2.48, ctr: 1.7, cpm: 42.10, impressoes: 69200, cliques: 1176 },
  { utm_campaign: 'suplemento_whey_perf', vendas: 12, cpa: 89.00, gastos: 1068, faturamento: 1548.60, lucro: 480.60, roas: 1.45, margem: 31.0, roi: 45, cpi: 0.052, cpc: 4.36, ctr: 1.2, cpm: 52.30, impressoes: 20420, cliques: 245 },
  { utm_campaign: 'bf_multi_produto', vendas: 70, cpa: 72.00, gastos: 5040, faturamento: 9676.80, lucro: 4636.80, roas: 1.92, margem: 47.9, roi: 92, cpi: 0.0448, cpc: 2.99, ctr: 1.5, cpm: 44.80, impressoes: 112500, cliques: 1688 },
  { utm_campaign: 'colageno_interesses', vendas: 13, cpa: 145.00, gastos: 1885, faturamento: 1545.70, lucro: -339.30, roas: 0.82, margem: -22.0, roi: -18, cpi: 0.0486, cpc: 6.08, ctr: 0.8, cpm: 48.60, impressoes: 38780, cliques: 310 },
  { utm_campaign: 'emagrecedor_lal2', vendas: 38, cpa: 51.20, gastos: 1945.60, faturamento: 5814, lucro: 3868.40, roas: 2.99, margem: 66.5, roi: 199, cpi: 0.040, cpc: 1.74, ctr: 2.3, cpm: 40.10, impressoes: 48520, cliques: 1116 },
  { utm_campaign: 'detox_stories_dp', vendas: 22, cpa: 38.50, gastos: 847, faturamento: 3564, lucro: 2717, roas: 4.21, margem: 76.2, roi: 321, cpi: 0.0354, cpc: 1.26, ctr: 2.8, cpm: 35.40, impressoes: 23920, cliques: 670 },
  { utm_campaign: 'whey_remarketing_vc', vendas: 15, cpa: 62.00, gastos: 930, faturamento: 2376, lucro: 1446, roas: 2.55, margem: 60.9, roi: 155, cpi: 0.0472, cpc: 3.10, ctr: 1.4, cpm: 47.20, impressoes: 19700, cliques: 300 },
  { utm_campaign: 'skincare_video_dep', vendas: 31, cpa: 44.80, gastos: 1388.80, faturamento: 5022, lucro: 3633.20, roas: 3.62, margem: 72.3, roi: 262, cpi: 0.0398, cpc: 1.95, ctr: 2.0, cpm: 39.80, impressoes: 34890, cliques: 712 },
  { utm_campaign: 'bf_countdown_urgency', vendas: 28, cpa: 68.50, gastos: 1918, faturamento: 3920, lucro: 2002, roas: 2.04, margem: 51.1, roi: 104, cpi: 0.044, cpc: 2.88, ctr: 1.6, cpm: 43.50, impressoes: 44090, cliques: 666 },
  { utm_campaign: 'detox_email_lista', vendas: 7, cpa: 18.90, gastos: 132.30, faturamento: 1134, lucro: 1001.70, roas: 8.57, margem: 88.3, roi: 757, cpi: 0.012, cpc: 0.85, ctr: 4.2, cpm: 12.40, impressoes: 10670, cliques: 156 },
];

const VENDAS_DATA: VendaRow[] = [
  { data: '29/03/2026 14:32', produto: 'Protocolo Detox 30d', cliente: 'Maria S.', valor: 197.00, status: 'Aprovado', plataforma: 'Hotmart', utm_source: 'facebook', utm_campaign: 'protocolo_detox_broad' },
  { data: '29/03/2026 13:18', produto: 'Kit Skincare Premium', cliente: 'Juliana F.', valor: 297.00, status: 'Aprovado', plataforma: 'Kiwify', utm_source: 'facebook', utm_campaign: 'kit_skincare_lal1' },
  { data: '29/03/2026 11:45', produto: 'Suplemento Whey ISO', cliente: 'Carlos M.', valor: 129.90, status: 'Aguardando', plataforma: 'Hotmart', utm_source: 'instagram', utm_campaign: 'suplemento_whey_perf' },
  { data: '29/03/2026 10:22', produto: 'Protocolo Detox 30d', cliente: 'Ana P.', valor: 197.00, status: 'Aprovado', plataforma: 'Hotmart', utm_source: 'facebook', utm_campaign: 'retarget_carrinho_7d' },
  { data: '28/03/2026 22:05', produto: 'Colageno Premium 90caps', cliente: 'Fernanda L.', valor: 89.90, status: 'Reembolsado', plataforma: 'Kiwify', utm_source: 'google', utm_campaign: 'colageno_interesses' },
  { data: '28/03/2026 19:40', produto: 'Kit Skincare Premium', cliente: 'Beatriz R.', valor: 297.00, status: 'Aprovado', plataforma: 'Kiwify', utm_source: 'facebook', utm_campaign: 'skincare_video_dep' },
  { data: '28/03/2026 17:12', produto: 'Emagrecedor Natural 60caps', cliente: 'Luciana T.', valor: 149.90, status: 'Aprovado', plataforma: 'Hotmart', utm_source: 'facebook', utm_campaign: 'emagrecedor_lal2' },
  { data: '28/03/2026 15:33', produto: 'Protocolo Detox 30d', cliente: 'Roberto G.', valor: 197.00, status: 'Aprovado', plataforma: 'Hotmart', utm_source: 'facebook', utm_campaign: 'protocolo_detox_broad' },
  { data: '28/03/2026 12:08', produto: 'Kit Skincare Premium', cliente: 'Camila N.', valor: 297.00, status: 'Aprovado', plataforma: 'Kiwify', utm_source: 'instagram', utm_campaign: 'detox_stories_dp' },
  { data: '27/03/2026 20:55', produto: 'Suplemento Whey ISO', cliente: 'Pedro A.', valor: 129.90, status: 'Aprovado', plataforma: 'Hotmart', utm_source: 'facebook', utm_campaign: 'whey_remarketing_vc' },
];

const RELATORIO_DATA: RelatorioRow[] = [
  { data: '29/03/2026', dia: 'Sab', vendas: 18, cpa: 48.20, gastos: 867.60, faturamento: 3294, lucro: 2426.40, roas: 3.80, margem: 73.6, roi: 280 },
  { data: '28/03/2026', dia: 'Sex', vendas: 24, cpa: 44.10, gastos: 1058.40, faturamento: 4512, lucro: 3453.60, roas: 4.26, margem: 76.5, roi: 326 },
  { data: '27/03/2026', dia: 'Qui', vendas: 21, cpa: 52.30, gastos: 1098.30, faturamento: 3801, lucro: 2702.70, roas: 3.46, margem: 71.1, roi: 246 },
  { data: '26/03/2026', dia: 'Qua', vendas: 16, cpa: 58.90, gastos: 942.40, faturamento: 2848, lucro: 1905.60, roas: 3.02, margem: 66.9, roi: 202 },
  { data: '25/03/2026', dia: 'Ter', vendas: 19, cpa: 46.50, gastos: 883.50, faturamento: 3459, lucro: 2575.50, roas: 3.91, margem: 74.5, roi: 291 },
  { data: '24/03/2026', dia: 'Seg', vendas: 14, cpa: 61.20, gastos: 856.80, faturamento: 2534, lucro: 1677.20, roas: 2.96, margem: 66.2, roi: 196 },
  { data: '23/03/2026', dia: 'Dom', vendas: 11, cpa: 68.40, gastos: 752.40, faturamento: 1947, lucro: 1194.60, roas: 2.59, margem: 61.4, roi: 159 },
  { data: '22/03/2026', dia: 'Sab', vendas: 15, cpa: 53.80, gastos: 807.00, faturamento: 2715, lucro: 1908.00, roas: 3.36, margem: 70.3, roi: 236 },
  { data: '21/03/2026', dia: 'Sex', vendas: 22, cpa: 45.60, gastos: 1003.20, faturamento: 4026, lucro: 3022.80, roas: 4.01, margem: 75.1, roi: 301 },
  { data: '20/03/2026', dia: 'Qui', vendas: 17, cpa: 55.10, gastos: 936.70, faturamento: 3077, lucro: 2140.30, roas: 3.29, margem: 69.5, roi: 228 },
];

// ── Styles ─────────────────────────────────────────────────────────────────

const S = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
    fontFamily: 'Outfit, sans-serif',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1e293b',
    fontFamily: 'Space Grotesk, sans-serif',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  filtersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
    marginBottom: 16,
  },
  select: {
    padding: '8px 14px',
    borderRadius: 14,
    border: 'none',
    background: 'rgba(240,243,248,0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    color: '#334155',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'Outfit, sans-serif',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 30,
    boxShadow: '6px 6px 14px rgba(15,23,42,0.07), -4px -4px 10px rgba(255,255,255,0.85), inset 0 1px 0 rgba(255,255,255,0.6)',
    transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
  },
  btnOutline: {
    padding: '8px 18px',
    borderRadius: 14,
    border: 'none',
    background: 'rgba(240,243,248,0.6)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'Outfit, sans-serif',
    transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
    boxShadow: '6px 6px 14px rgba(15,23,42,0.07), -4px -4px 10px rgba(255,255,255,0.85), inset 0 1px 0 rgba(255,255,255,0.5)',
  },
  btnPrimary: {
    padding: '8px 20px',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'Outfit, sans-serif',
    transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
    boxShadow: '4px 4px 14px rgba(59,130,246,0.30), -3px -3px 8px rgba(255,255,255,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
  },
  card: {
    position: 'relative' as const,
    background: 'rgba(240,243,248,0.55)',
    backdropFilter: 'blur(48px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(48px) saturate(1.6)',
    border: '1px solid rgba(255,255,255,0.50)',
    borderRadius: 22,
    overflow: 'hidden' as const,
    boxShadow: '12px 12px 30px rgba(15,23,42,0.08), -8px -8px 24px rgba(255,255,255,0.90), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(255,255,255,0.15)',
    transformStyle: 'preserve-3d' as const,
    transition: 'transform 0.5s cubic-bezier(.4,0,.2,1), box-shadow 0.5s cubic-bezier(.4,0,.2,1)',
  },
  // Reflexo interno — camada superior de brilho tipo vidro real
  cardReflection: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0) 100%)',
    pointerEvents: 'none' as const,
    zIndex: 1,
    borderRadius: '22px 22px 0 0',
  },
  // Segunda camada — reflexo lateral sutil
  cardSheen: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.06) 100%)',
    pointerEvents: 'none' as const,
    zIndex: 1,
    borderRadius: 22,
  },
  tableWrap: {
    position: 'relative' as const,
    overflowX: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'separate' as const,
    borderSpacing: 0,
    minWidth: 1100,
  },
  th: {
    padding: '10px 14px',
    fontSize: 10,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    textAlign: 'left' as const,
    background: 'rgba(240,243,248,0.70)',
    backdropFilter: 'blur(16px)',
    whiteSpace: 'nowrap' as const,
    borderBottom: '1px solid rgba(255,255,255,0.6)',
    borderRight: '1px solid rgba(255,255,255,0.25)',
    fontFamily: 'Outfit, sans-serif',
    position: 'sticky' as const,
    top: 0,
    zIndex: 2,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
  },
  thRight: {
    textAlign: 'right' as const,
  },
  td: {
    padding: '9px 14px',
    fontSize: 13,
    color: '#1e293b',
    borderBottom: '1px solid rgba(15,23,42,0.05)',
    borderRight: '1px solid rgba(15,23,42,0.03)',
    whiteSpace: 'nowrap' as const,
    fontFamily: 'Outfit, sans-serif',
  },
  tdMono: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 12,
    color: '#0f172a',
    textAlign: 'right' as const,
  },
  tdRight: {
    textAlign: 'right' as const,
  },
  trHover: {
    transition: 'background 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s cubic-bezier(.4,0,.2,1)',
  },
};

// Profundidade alternada neumorphic — coluna "levantada" vs "afundada"
// Sticky columns: col 0 (STATUS ~90px), col 1 (CAMPANHA ~280px)
const STICKY_W0 = 90;
const STICKY_W1 = 280;

function stickyCol(col: 0 | 1, isHeader: boolean): React.CSSProperties {
  const left = col === 0 ? 0 : STICKY_W0;
  return {
    position: 'sticky',
    left,
    zIndex: isHeader ? 4 : 3,
    background: isHeader ? 'rgba(240,243,248,0.95)' : 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(8px)',
    ...(col === 1 ? { boxShadow: '4px 0 12px rgba(15,23,42,0.06)' } : {}),
  };
}

// Drag-to-scroll hook
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    isDragging.current = true;
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
    ref.current.style.cursor = 'grabbing';
    ref.current.style.userSelect = 'none';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !ref.current) return;
    const x = e.pageX - ref.current.offsetLeft;
    ref.current.scrollLeft = scrollLeft.current - (x - startX.current);
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    if (ref.current) {
      ref.current.style.cursor = 'grab';
      ref.current.style.userSelect = '';
    }
  }, []);

  return { ref, onMouseDown, onMouseMove, onMouseUp, onMouseLeave: onMouseUp };
}

function colDepthTh(i: number): React.CSSProperties {
  if (i % 2 === 0) return {
    background: 'rgba(245,247,250,0.80)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(15,23,42,0.03)',
  };
  return {
    background: 'rgba(230,235,242,0.55)',
    boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.04), inset 0 -1px 0 rgba(255,255,255,0.4)',
  };
}

function colDepthTd(i: number): React.CSSProperties {
  if (i % 2 === 0) return {
    background: 'rgba(255,255,255,0.30)',
    boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.45), inset -1px 0 0 rgba(255,255,255,0.45)',
  };
  return {
    background: 'rgba(235,238,244,0.25)',
    boxShadow: 'inset 1px 0 0 rgba(15,23,42,0.02), inset -1px 0 0 rgba(15,23,42,0.02)',
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function roasColor(v: number): string {
  if (v >= 3) return '#16a34a';
  if (v >= 1.5) return '#2563eb';
  return '#dc2626';
}

function lucroColor(v: number): string {
  return v >= 0 ? '#16a34a' : '#dc2626';
}

function statusBadge(s: CampaignStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  };
  switch (s) {
    case 'ACTIVE':
      return { ...base, background: 'rgba(22,163,74,0.10)', color: '#16a34a' };
    case 'PAUSED':
      return { ...base, background: 'rgba(100,116,139,0.10)', color: '#64748b' };
    case 'LEARNING':
      return { ...base, background: 'rgba(37,99,235,0.10)', color: '#2563eb' };
  }
}

const STATUS_LABEL: Record<CampaignStatus, string> = {
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  LEARNING: 'Aprendizado',
};

function vendaStatusStyle(s: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
  };
  if (s === 'Aprovado') return { ...base, background: 'rgba(22,163,74,0.10)', color: '#16a34a' };
  if (s === 'Reembolsado') return { ...base, background: 'rgba(220,38,38,0.10)', color: '#dc2626' };
  return { ...base, background: 'rgba(234,179,8,0.10)', color: '#ca8a04' };
}

// ── View Titles ────────────────────────────────────────────────────────────

function getViewTitle(view: string): { title: string; subtitle: string } {
  switch (view) {
    case 'utm-campanhas':
      return { title: 'Campanhas', subtitle: 'Performance das campanhas ativas' };
    case 'utm-utms':
      return { title: 'UTMs', subtitle: 'Rastreamento por utm_campaign' };
    case 'utm-vendas':
      return { title: 'Vendas', subtitle: 'Historico de vendas rastreadas' };
    case 'utm-relatorios':
      return { title: 'Relatorios', subtitle: 'Analise diaria consolidada' };
    default:
      return { title: 'Campanhas', subtitle: 'Performance das campanhas ativas' };
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function UTMTracking() {
  const currentModule = useStore((s) => s.currentModule);
  const isMobile = useIsMobile();

  const [periodo, setPeriodo] = useState('7');
  const [produto, setProduto] = useState('all');
  const [conta, setConta] = useState('all');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const dragScroll = useDragScroll();

  // Determine active view
  const validViews = ['utm-campanhas', 'utm-utms', 'utm-vendas', 'utm-relatorios'];
  const activeView = validViews.includes(currentModule) ? currentModule : 'utm-campanhas';
  const { title, subtitle } = getViewTitle(activeView);

  const filtersStyle: React.CSSProperties = isMobile
    ? { ...S.filtersRow, flexDirection: 'column', alignItems: 'stretch' }
    : S.filtersRow;

  const selectStyle: React.CSSProperties = isMobile
    ? { ...S.select, width: '100%' }
    : S.select;

  const rowHoverBg = 'rgba(255,255,255,0.50)';
  const rowStripeBg = 'rgba(255,255,255,0.20)';

  const highlightTh: React.CSSProperties = { background: 'rgba(59,130,246,0.10)', color: '#1e40af', borderBottom: '1px solid rgba(59,130,246,0.20)', boxShadow: 'inset 0 -2px 0 rgba(59,130,246,0.15)' };
  const highlightTd: React.CSSProperties = { background: 'rgba(59,130,246,0.04)', borderRight: '1px solid rgba(59,130,246,0.08)', borderLeft: '1px solid rgba(59,130,246,0.08)' };

  return (
    <div style={S.wrapper}>
      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>{title}</h1>
        <p style={S.subtitle}>{subtitle}</p>
      </div>

      {/* Filters */}
      <div style={filtersStyle}>
        <select value={periodo} onChange={e => setPeriodo(e.target.value)} style={selectStyle}>
          <option value="0">Hoje</option>
          <option value="7">7 dias</option>
          <option value="14">14 dias</option>
          <option value="30">30 dias</option>
          <option value="month">Este mes</option>
        </select>

        <select value={produto} onChange={e => setProduto(e.target.value)} style={selectStyle}>
          <option value="all">Produto: Qualquer</option>
          <option value="detox">Protocolo Detox 30d</option>
          <option value="skincare">Kit Skincare Premium</option>
          <option value="whey">Suplemento Whey ISO</option>
        </select>

        <select value={conta} onChange={e => setConta(e.target.value)} style={selectStyle}>
          <option value="all">Conta: Qualquer</option>
          <option value="main">Conta Principal</option>
        </select>

        <div style={{ flex: 1 }} />

        <button style={S.btnOutline} type="button" onClick={() => {
          const dataMap: Record<string, unknown[]> = {
            'utm-campanhas': CAMPANHAS_DATA,
            'utm-utms': UTM_DATA,
            'utm-vendas': VENDAS_DATA,
            'utm-relatorios': RELATORIO_DATA,
          };
          const rows = dataMap[activeView] || CAMPANHAS_DATA;
          if (rows.length === 0) { showToast('info', 'Nenhum dado para exportar'); return; }
          const headers = Object.keys(rows[0] as Record<string, unknown>);
          const csv = [headers.join(';'), ...rows.map(r => headers.map(h => String((r as Record<string, unknown>)[h] ?? '')).join(';'))].join('\n');
          const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `${activeView}_${periodo}.csv`; a.click();
          URL.revokeObjectURL(url);
          showToast('success', 'Arquivo CSV exportado com sucesso!');
        }}>
          <Download size={14} />
          Exportar
        </button>
        <button style={S.btnPrimary} type="button" onClick={() => {
          showToast('info', 'Dados atualizados');
        }}>
          <RefreshCw size={14} />
          Atualizar
        </button>
      </div>

      {/* Table Card */}
      <div style={{ position: 'relative' }}>
        {/* Fumaça / glow denso atrás do card */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '-30px',
          right: '-30px',
          bottom: '-30px',
          background: 'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.06) 0%, transparent 55%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      <div
        className="tilt-card"
        style={S.card}
      >
        <div style={S.cardReflection} />
        <div style={S.cardSheen} />
        <div
          ref={dragScroll.ref}
          onMouseDown={dragScroll.onMouseDown}
          onMouseMove={dragScroll.onMouseMove}
          onMouseUp={dragScroll.onMouseUp}
          onMouseLeave={dragScroll.onMouseLeave}
          style={{ ...S.tableWrap, cursor: 'grab' }}
        >
          {activeView === 'utm-campanhas' && !isMobile && (
            <table style={S.table}>
              <thead>
                <tr>
                  {['STATUS', 'CAMPANHA', 'ORÇAMENTO', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'].map((h, i) => (
                    <th key={h} style={{
                      ...S.th, ...colDepthTh(i),
                      ...(i >= 2 ? S.thRight : {}),
                      ...(i === 1 ? highlightTh : {}),
                      ...(i <= 1 ? stickyCol(i as 0 | 1, true) : {}),
                      ...(i === 0 ? { minWidth: STICKY_W0 } : {}),
                      ...(i === 1 ? { minWidth: STICKY_W1 } : {}),
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAMPANHAS_DATA.map((r, idx) => (
                  <tr
                    key={idx}
                    style={{ ...S.trHover, background: hoveredRow === idx ? rowHoverBg : idx % 2 === 1 ? rowStripeBg : 'transparent' }}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={{ ...S.td, ...colDepthTd(0), ...stickyCol(0, false), minWidth: STICKY_W0 }}>
                      <span style={statusBadge(r.status)}>{STATUS_LABEL[r.status]}</span>
                    </td>
                    <td style={{ ...S.td, ...colDepthTd(1), ...highlightTd, ...stickyCol(1, false), fontWeight: 600, minWidth: STICKY_W1 }}>{r.campanha}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(2) }}>{formatCurrency(r.orcamento)}/dia</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(3), fontWeight: 700 }}>{r.vendas}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(4) }}>{formatCurrency(r.cpa)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(5) }}>{formatCurrency(r.gastos)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(6) }}>{formatCurrency(r.faturamento)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(7), color: lucroColor(r.lucro), fontWeight: 600 }}>{formatCurrency(r.lucro)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(8), color: roasColor(r.roas), fontWeight: 700 }}>{r.roas.toFixed(2)}x</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(9) }}>{r.margem.toFixed(1)}%</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(10) }}>{r.roi}%</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(11) }}>{r.ctr.toFixed(1)}%</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(12) }}>{formatCurrency(r.cpm)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(13) }}>{formatNumber(r.impressoes)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(14) }}>{formatNumber(r.cliques)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Mobile: Tag bolha + carrossel de métricas */}
          {activeView === 'utm-campanhas' && isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 4 }}>
              {CAMPANHAS_DATA.map((r, idx) => (
                <div key={idx} style={{
                  borderRadius: 16, overflow: 'hidden',
                  border: '1px solid rgba(15,23,42,0.06)',
                  background: 'rgba(255,255,255,0.5)',
                }}>
                  {/* Bolha: nome da campanha + status */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', gap: 8,
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(15,23,42,0.05)',
                    position: 'sticky', top: 0, zIndex: 2,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {r.campanha}
                    </span>
                    <span style={statusBadge(r.status)}>{STATUS_LABEL[r.status]}</span>
                  </div>

                  {/* Carrossel de métricas arrastável */}
                  <div style={{
                    display: 'flex', gap: 0, overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}>
                    {[
                      { l: 'ROAS', v: `${r.roas.toFixed(2)}x`, c: roasColor(r.roas) },
                      { l: 'CPA', v: formatCurrency(r.cpa), c: '#0f172a' },
                      { l: 'Vendas', v: String(r.vendas), c: '#16a34a' },
                      { l: 'Gastos', v: formatCurrency(r.gastos), c: '#0f172a' },
                      { l: 'Faturamento', v: formatCurrency(r.faturamento), c: '#0f172a' },
                      { l: 'Lucro', v: formatCurrency(r.lucro), c: lucroColor(r.lucro) },
                      { l: 'Margem', v: `${r.margem.toFixed(1)}%`, c: '#0f172a' },
                      { l: 'ROI', v: `${r.roi}%`, c: '#0f172a' },
                      { l: 'CTR', v: `${r.ctr.toFixed(1)}%`, c: '#0f172a' },
                      { l: 'CPM', v: formatCurrency(r.cpm), c: '#0f172a' },
                      { l: 'Impressões', v: formatNumber(r.impressoes), c: '#64748b' },
                      { l: 'Cliques', v: formatNumber(r.cliques), c: '#64748b' },
                    ].map(m => (
                      <div key={m.l} style={{
                        minWidth: 90, flexShrink: 0, textAlign: 'center',
                        padding: '12px 8px',
                        borderRight: '1px solid rgba(15,23,42,0.04)',
                        scrollSnapAlign: 'start',
                      }}>
                        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{m.l}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: m.c, fontFamily: "'JetBrains Mono', monospace" }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                </div>
              ))}
            </div>
          )}

          {activeView === 'utm-utms' && (
            <table style={S.table}>
              <thead>
                <tr>
                  {['UTM_CAMPAIGN', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'CPI', 'CPC', 'CTR', 'CPM', 'IMPRESSOES', 'CLIQUES'].map((h, i) => (
                    <th key={h} style={{ ...S.th, ...colDepthTh(i), ...(i >= 1 ? S.thRight : {}), ...(i === 0 ? highlightTh : {}) }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {UTM_DATA.map((r, idx) => (
                  <tr
                    key={idx}
                    style={{ ...S.trHover, background: hoveredRow === idx ? rowHoverBg : idx % 2 === 1 ? rowStripeBg : 'transparent' }}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={{ ...S.td, ...colDepthTd(0), ...highlightTd, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{r.utm_campaign}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(1), fontWeight: 700 }}>{r.vendas}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(2) }}>{formatCurrency(r.cpa)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(3) }}>{formatCurrency(r.gastos)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(4) }}>{formatCurrency(r.faturamento)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(5), color: lucroColor(r.lucro), fontWeight: 600 }}>{formatCurrency(r.lucro)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(6), color: roasColor(r.roas), fontWeight: 700 }}>{r.roas.toFixed(2)}x</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(7) }}>{r.margem.toFixed(1)}%</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(8) }}>{r.roi}%</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(9) }}>{formatCurrency(r.cpi)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(10) }}>{formatCurrency(r.cpc)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(11) }}>{r.ctr.toFixed(1)}%</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(12) }}>{formatCurrency(r.cpm)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(13) }}>{formatNumber(r.impressoes)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(14) }}>{formatNumber(r.cliques)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeView === 'utm-vendas' && (
            <table style={{ ...S.table, minWidth: 900 }}>
              <thead>
                <tr>
                  {['DATA', 'PRODUTO', 'CLIENTE', 'VALOR', 'STATUS', 'PLATAFORMA', 'UTM_SOURCE', 'UTM_CAMPAIGN'].map((h, i) => (
                    <th key={h} style={{ ...S.th, ...colDepthTh(i), ...(i === 3 ? S.thRight : {}), ...(i === 1 ? highlightTh : {}) }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VENDAS_DATA.map((r, idx) => (
                  <tr
                    key={idx}
                    style={{ ...S.trHover, background: hoveredRow === idx ? rowHoverBg : idx % 2 === 1 ? rowStripeBg : 'transparent' }}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={{ ...S.td, ...colDepthTd(0), fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{r.data}</td>
                    <td style={{ ...S.td, ...colDepthTd(1), ...highlightTd, fontWeight: 600 }}>{r.produto}</td>
                    <td style={{ ...S.td, ...colDepthTd(2) }}>{r.cliente}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(3), fontWeight: 600 }}>{formatCurrency(r.valor)}</td>
                    <td style={{ ...S.td, ...colDepthTd(4) }}>
                      <span style={vendaStatusStyle(r.status)}>{r.status}</span>
                    </td>
                    <td style={{ ...S.td, ...colDepthTd(5) }}>{r.plataforma}</td>
                    <td style={{ ...S.td, ...colDepthTd(6), fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{r.utm_source}</td>
                    <td style={{ ...S.td, ...colDepthTd(7), fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{r.utm_campaign}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeView === 'utm-relatorios' && (
            <table style={{ ...S.table, minWidth: 850 }}>
              <thead>
                <tr>
                  {['DATA', 'DIA', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI'].map((h, i) => (
                    <th key={h} style={{ ...S.th, ...colDepthTh(i), ...(i >= 2 ? S.thRight : {}), ...(i === 6 ? highlightTh : {}) }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RELATORIO_DATA.map((r, idx) => (
                  <tr
                    key={idx}
                    style={{ ...S.trHover, background: hoveredRow === idx ? rowHoverBg : idx % 2 === 1 ? rowStripeBg : 'transparent' }}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={{ ...S.td, ...colDepthTd(0), fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{r.data}</td>
                    <td style={{ ...S.td, ...colDepthTd(1), fontWeight: 600 }}>{r.dia}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(2), fontWeight: 700 }}>{r.vendas}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(3) }}>{formatCurrency(r.cpa)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(4) }}>{formatCurrency(r.gastos)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(5) }}>{formatCurrency(r.faturamento)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(6), ...highlightTd, color: lucroColor(r.lucro), fontWeight: 600 }}>{formatCurrency(r.lucro)}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(7), color: roasColor(r.roas), fontWeight: 700 }}>{r.roas.toFixed(2)}x</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(8) }}>{r.margem.toFixed(1)}%</td>
                    <td style={{ ...S.td, ...S.tdMono, ...colDepthTd(9) }}>{r.roi}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>{/* fecha wrapper fumaça */}
    </div>
  );
}
