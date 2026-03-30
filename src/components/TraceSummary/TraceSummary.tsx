import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Info, ChevronDown } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useStore } from '../../store/useStore';
import { COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { getSalesSummary, type SalesSummary } from '../../services/salesService';

// ---- types ----
type Period = 'today' | '7d' | '14d' | '30d';

interface MetricCard {
  label: string;
  value: string;
  type: 'currency' | 'percent' | 'ratio' | 'list' | 'chart' | 'rates' | 'empty';
}

// ---- Filter Select ----
function FilterSelect({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140, flex: 1 }}>
      <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: 'Outfit' }}>{label}</span>
      <div style={{
        position: 'relative',
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 32px 8px 12px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'Outfit',
            fontSize: 13,
            color: COLORS.text,
            cursor: 'pointer',
            appearance: 'none',
          }}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: COLORS.textMuted,
        }} />
      </div>
    </div>
  );
}

// ---- Metric Card ----
function MetricCardUI({ card }: { card: MetricCard }) {
  if (card.type === 'empty') return <div />;

  if (card.type === 'list') {
    return (
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <span style={cardLabelStyle}>{card.label}</span>
          <Info size={13} style={{ color: COLORS.textDim, flexShrink: 0 }} />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
          <span style={{ fontSize: 13, color: COLORS.textMuted, fontFamily: 'Outfit' }}>
            Nenhuma venda por aqui
          </span>
        </div>
      </div>
    );
  }

  if (card.type === 'chart') {
    const segments = [
      { label: 'Pix', color: '#6366f1' },
      { label: 'Cartao', color: '#8b5cf6' },
      { label: 'Boleto', color: '#f59e0b' },
      { label: 'Outros', color: '#94a3b8' },
    ];
    return (
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <span style={cardLabelStyle}>{card.label}</span>
          <Info size={13} style={{ color: COLORS.textDim, flexShrink: 0 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0', gap: 16 }}>
          {/* Placeholder circle */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            border: `3px solid ${COLORS.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: 'JetBrains Mono' }}>0</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {segments.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: 'Outfit' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (card.type === 'rates') {
    const rates = ['Cartao', 'Pix', 'Boleto'];
    return (
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <span style={cardLabelStyle}>{card.label}</span>
          <Info size={13} style={{ color: COLORS.textDim, flexShrink: 0 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' }}>
          {rates.map(r => (
            <div key={r} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Outfit' }}>{r}</span>
              <span style={{ fontSize: 13, color: COLORS.textMuted, fontFamily: 'JetBrains Mono' }}>N/A</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span style={cardLabelStyle}>{card.label}</span>
        <Info size={13} style={{ color: COLORS.textDim, flexShrink: 0 }} />
      </div>
      <span style={{
        fontSize: 22, fontWeight: 600,
        fontFamily: card.type === 'currency' ? 'Space Grotesk' : 'JetBrains Mono',
        color: COLORS.text,
        marginTop: 8,
      }}>
        {card.value}
      </span>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 14,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 90,
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: COLORS.textMuted,
  fontFamily: 'Outfit',
  fontWeight: 500,
};

// ---- Main Component ----
// Mock fallback para demo mode
const MOCK_SUMMARY: SalesSummary = {
  totalSales: 293, pendingSales: 12, refundedSales: 8,
  grossRevenue: 47559, netRevenue: 35109, totalCommission: 3820,
  refundedAmount: 1240, avgTicket: 162.25,
};

export default function TraceSummary() {
  const isMobile = useIsMobile();
  const metrics = useStore((s) => s.metrics);
  const [period, setPeriod] = useState<Period>('7d');
  const [updatedAt, setUpdatedAt] = useState('agora mesmo');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summary, setSummary] = useState<SalesSummary | null>(null);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getSalesSummary(period);
      setSummary(data);
      setUpdatedAt('agora mesmo');
    } catch {
      // Fallback to null (zeros shown)
    } finally {
      setIsRefreshing(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  const s = summary || MOCK_SUMMARY;
  const net = s.netRevenue;
  const adSpend = metrics.spend || 12450; // from store or mock fallback
  const roas = adSpend > 0 ? (net / adSpend).toFixed(2) : 'N/A';
  const profit = net - adSpend;
  const roi = adSpend > 0 ? (((net - adSpend) / adSpend) * 100).toFixed(1) + '%' : 'N/A';
  const margin = net > 0 ? ((profit / net) * 100).toFixed(1) + '%' : 'N/A';
  const refundPct = s && s.totalSales > 0 ? ((s.refundedSales / s.totalSales) * 100).toFixed(1) + '%' : '0.0%';

  const cards: MetricCard[] = [
    // Row 1
    { label: 'Faturamento Liquido', value: formatCurrency(net), type: 'currency' },
    { label: 'Gastos com anuncios', value: formatCurrency(adSpend), type: 'currency' },
    { label: 'ROAS', value: String(roas), type: 'ratio' },
    { label: 'Lucro', value: formatCurrency(profit), type: 'currency' },
    // Row 2
    { label: 'Vendas por Produto', value: '', type: 'list' },
    { label: 'Vendas Pendentes', value: formatCurrency(s ? s.pendingSales : 0), type: 'currency' },
    { label: 'ROI', value: String(roi), type: 'ratio' },
    { label: 'Custos de Produto', value: formatCurrency(0), type: 'currency' },
    // Row 3
    { label: '', value: '', type: 'empty' },
    { label: 'Vendas Reembolsadas', value: formatCurrency(s ? s.refundedAmount : 0), type: 'currency' },
    { label: 'Margem', value: String(margin), type: 'ratio' },
    { label: 'Despesas adicionais', value: formatCurrency(0), type: 'currency' },
    // Row 4
    { label: '', value: '', type: 'empty' },
    { label: 'Imposto sobre vendas', value: formatCurrency(0), type: 'currency' },
    { label: 'Reembolso', value: refundPct, type: 'percent' },
    { label: 'Taxas', value: formatCurrency(s ? s.totalCommission : 0), type: 'currency' },
    // Row 5
    { label: 'Vendas por Pagamento', value: '', type: 'chart' },
    { label: 'Imposto total', value: formatCurrency(0), type: 'currency' },
    { label: 'Chargeback', value: '0.0%', type: 'percent' },
    { label: 'Imposto Meta Ads', value: formatCurrency(0), type: 'currency' },
    // Row 6
    { label: '', value: '', type: 'empty' },
    { label: 'Vendas por Fonte', value: '', type: 'list' },
    { label: 'Taxa de Aprovacao', value: '', type: 'rates' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Outfit', color: COLORS.text, margin: 0 }}>
            Resumo
          </h1>
          <span style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: 'Outfit' }}>
            Atualizado {updatedAt}
          </span>
        </div>
        <button
          onClick={loadData}
          disabled={isRefreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 10,
            background: COLORS.accent, color: '#fff',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Outfit', fontSize: 13, fontWeight: 600,
            opacity: isRefreshing ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap',
        padding: '14px 18px',
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
      }}>
        <FilterSelect
          label="Periodo"
          value={period}
          onChange={(v) => setPeriod(v as Period)}
          options={[
            { value: 'today', label: 'Hoje' },
            { value: '7d', label: 'Ultimos 7 dias' },
            { value: '14d', label: 'Ultimos 14 dias' },
            { value: '30d', label: 'Ultimos 30 dias' },
          ]}
        />
        <FilterSelect label="Conta de Anuncio" value="any" onChange={() => {}} options={[{ value: 'any', label: 'Qualquer' }]} />
        <FilterSelect label="Fonte de Trafego" value="any" onChange={() => {}} options={[{ value: 'any', label: 'Qualquer' }]} />
        <FilterSelect label="Plataforma" value="any" onChange={() => {}} options={[{ value: 'any', label: 'Qualquer' }]} />
        <FilterSelect label="Produto" value="any" onChange={() => {}} options={[{ value: 'any', label: 'Qualquer' }]} />
      </div>

      {/* Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 14,
      }}>
        {cards.map((card, i) => (
          <MetricCardUI key={`${card.label}-${i}`} card={card} />
        ))}
      </div>

      {/* Spin keyframe injected inline */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
