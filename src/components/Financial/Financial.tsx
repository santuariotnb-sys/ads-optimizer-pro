import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign, TrendingUp, TrendingDown, PieChart, Receipt, ArrowUpRight,
  ArrowDownRight, Plus, Trash2, Calendar, CreditCard, Users, Wrench,
  MoreHorizontal,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { formatCurrency } from '../../utils/formatters';
import { COLORS, COLORS_LIGHT } from '../../utils/constants';
import { getSalesSummary, type SalesSummary } from '../../services/salesService';
import { fetchExpenses, createExpense, deleteExpense, EXPENSE_CATEGORIES, type Expense } from '../../services/expenseService';
import { supabase } from '../../lib/supabase';

interface MonthlyDRE {
  month: string;
  receita_bruta: number;
  taxas_plataforma: number;
  reembolsos: number;
  receita_liquida: number;
}

async function fetchMonthlyDRE(): Promise<MonthlyDRE[]> {
  try {
    const { data, error } = await supabase
      .from('monthly_dre')
      .select('*')
      .order('month', { ascending: false })
      .limit(6);
    if (error || !data || data.length === 0) return [];
    return data as MonthlyDRE[];
  } catch {
    return [];
  }
}

// Mock data for demo mode
const MOCK_SUMMARY: SalesSummary = {
  totalSales: 147, pendingSales: 12, refundedSales: 8, grossRevenue: 43659,
  netRevenue: 39293.10, totalCommission: 4365.90, refundedAmount: 2376, avgTicket: 297,
};

const MOCK_EXPENSES: Expense[] = [
  { id: '1', category: 'meta_ads', description: 'Meta Ads — Março', amount: 8420, is_recurring: true, recurring_day: 1, reference_date: '2026-03-01' },
  { id: '2', category: 'equipe', description: 'Gestor de tráfego', amount: 3500, is_recurring: true, recurring_day: 5, reference_date: '2026-03-05' },
  { id: '3', category: 'ferramentas', description: 'Utmify + ActiveCampaign + Hotmart', amount: 497, is_recurring: true, recurring_day: 10, reference_date: '2026-03-10' },
  { id: '4', category: 'criativos', description: 'Produção de vídeo (3 VSLs)', amount: 2200, is_recurring: false, recurring_day: null, reference_date: '2026-03-15' },
  { id: '5', category: 'hospedagem', description: 'Vercel + domínio', amount: 120, is_recurring: true, recurring_day: 1, reference_date: '2026-03-01' },
  { id: '6', category: 'impostos', description: 'Simples Nacional estimado', amount: 2620, is_recurring: true, recurring_day: 20, reference_date: '2026-03-20' },
];

const CATEGORY_ICONS: Record<string, typeof DollarSign> = {
  meta_ads: CreditCard, google_ads: CreditCard, tiktok_ads: CreditCard,
  equipe: Users, ferramentas: Wrench, criativos: PieChart,
  hospedagem: Receipt, impostos: Receipt, outros: MoreHorizontal,
};

export default function Financial() {
  const theme = useStore((s) => s.theme);
  const mode = useStore((s) => s.mode);
  const selectedPeriod = useStore((s) => s.selectedPeriod);
  const metrics = useStore((s) => s.metrics);
  const isMobile = useIsMobile();
  const c = theme === 'dark' ? COLORS : COLORS_LIGHT;

  const [summary, setSummary] = useState<SalesSummary>(MOCK_SUMMARY);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [monthlyDRE, setMonthlyDRE] = useState<MonthlyDRE[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: 'outros', description: '', amount: '', is_recurring: false, reference_date: new Date().toISOString().split('T')[0] });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (mode !== 'live') return;
    let cancelled = false;
    (async () => {
      try {
        const [salesData, expensesData, dreData] = await Promise.all([
          getSalesSummary(selectedPeriod),
          fetchExpenses(new Date().toISOString().slice(0, 7)),
          fetchMonthlyDRE(),
        ]);
        if (!cancelled) {
          setSummary(salesData);
          setExpenses(expensesData);
          setMonthlyDRE(dreData);
        }
      } catch {
        // fallback to mock
      }
    })();
    return () => { cancelled = true; };
  }, [mode, selectedPeriod, refreshKey]);

  // Also try to fetch monthly DRE in demo mode (will use mock fallback if Supabase not configured)
  useEffect(() => {
    if (mode === 'live') return;
    let cancelled = false;
    fetchMonthlyDRE().then((data) => {
      if (!cancelled && data.length > 0) setMonthlyDRE(data);
    });
    return () => { cancelled = true; };
  }, [mode]);

  async function handleAddExpense() {
    if (!newExpense.amount || !newExpense.category) return;
    if (mode === 'live') {
      await createExpense({
        category: newExpense.category,
        description: newExpense.description || undefined,
        amount: Number(newExpense.amount),
        is_recurring: newExpense.is_recurring,
        reference_date: newExpense.reference_date,
      });
      setRefreshKey(k => k + 1);
    } else {
      setExpenses(prev => [...prev, {
        id: crypto.randomUUID(),
        category: newExpense.category,
        description: newExpense.description || null,
        amount: Number(newExpense.amount),
        is_recurring: newExpense.is_recurring,
        recurring_day: null,
        reference_date: newExpense.reference_date,
      }]);
    }
    setNewExpense({ category: 'outros', description: '', amount: '', is_recurring: false, reference_date: new Date().toISOString().split('T')[0] });
    setShowAddExpense(false);
  }

  async function handleDeleteExpense(id: string) {
    if (mode === 'live') {
      await deleteExpense(id);
      setRefreshKey(k => k + 1);
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const adSpend = metrics.spend || expenses.filter(e => ['meta_ads', 'google_ads', 'tiktok_ads'].includes(e.category)).reduce((sum, e) => sum + Number(e.amount), 0);
  const lucroBruto = summary.netRevenue - adSpend;
  const operationalCosts = totalExpenses - adSpend;
  const lucroLiquido = lucroBruto - (operationalCosts > 0 ? operationalCosts : 0);
  const margemBruta = summary.grossRevenue > 0 ? (lucroBruto / summary.grossRevenue) * 100 : 0;
  const margemLiquida = summary.grossRevenue > 0 ? (lucroLiquido / summary.grossRevenue) * 100 : 0;
  const roas = adSpend > 0 ? summary.grossRevenue / adSpend : 0;
  const roi = totalExpenses > 0 ? ((summary.netRevenue - totalExpenses) / totalExpenses) * 100 : 0;

  const expensesByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${c.success}, #16a34a)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DollarSign size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Controle Financeiro</h1>
          <p style={{ fontSize: 13, color: c.textMuted }}>DRE simplificado, custos e lucratividade</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Faturamento Bruto', value: summary.grossRevenue, icon: DollarSign, color: c.accent },
          { label: 'Gasto com Tráfego', value: adSpend, icon: CreditCard, color: c.warning },
          { label: 'Lucro Líquido', value: lucroLiquido, icon: lucroLiquido >= 0 ? TrendingUp : TrendingDown, color: lucroLiquido >= 0 ? c.success : c.danger },
          { label: 'ROAS Geral', value: roas, icon: ArrowUpRight, color: roas >= 3 ? c.success : roas >= 1 ? c.warning : c.danger, isCurrency: false, suffix: 'x' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card tilt-card"
            style={{ padding: 16, borderRadius: 14, background: c.surface2, border: `1px solid ${c.border}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.label}</span>
              <kpi.icon size={16} color={kpi.color} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.text, fontFamily: 'Space Grotesk' }}>
              {kpi.isCurrency === false ? `${kpi.value.toFixed(2)}${kpi.suffix || ''}` : formatCurrency(kpi.value)}
            </div>
          </motion.div>
        ))}
      </div>

      {/* DRE */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card tilt-card"
        style={{ padding: 24, borderRadius: 16, background: c.surface2, border: `1px solid ${c.border}` }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Receipt size={16} color={c.accent} /> DRE — Demonstrativo de Resultado
        </h3>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>
          {[
            { label: '(+) Receita Bruta de Vendas', value: summary.grossRevenue, bold: false, color: c.text },
            { label: '(-) Taxas de Plataforma', value: -summary.totalCommission, bold: false, color: c.danger },
            { label: '(-) Reembolsos / Chargebacks', value: -summary.refundedAmount, bold: false, color: c.danger },
            { label: '(=) RECEITA LÍQUIDA', value: summary.netRevenue, bold: true, color: c.accent, divider: true },
            { label: '(-) Custo de Tráfego Pago', value: -adSpend, bold: false, color: c.danger },
            { label: '(=) LUCRO BRUTO', value: lucroBruto, bold: true, color: lucroBruto >= 0 ? c.success : c.danger, divider: true },
            ...Object.entries(expensesByCategory)
              .filter(([cat]) => !['meta_ads', 'google_ads', 'tiktok_ads'].includes(cat))
              .map(([cat, val]) => ({
                label: `(-) ${EXPENSE_CATEGORIES.find(ec => ec.id === cat)?.label || cat}`,
                value: -val, bold: false, color: c.danger,
              })),
            { label: '(=) LUCRO LÍQUIDO', value: lucroLiquido, bold: true, color: lucroLiquido >= 0 ? c.success : c.danger, divider: true },
          ].map((row, i) => (
            <div key={i}>
              {'divider' in row && row.divider && <div style={{ borderTop: `1px solid ${c.border}`, margin: '8px 0' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontWeight: row.bold ? 700 : 400 }}>
                <span style={{ color: c.textSecondary }}>{row.label}</span>
                <span style={{ color: row.color }}>{formatCurrency(Math.abs(row.value))}</span>
              </div>
            </div>
          ))}
          <div style={{ borderTop: `2px solid ${c.border}`, marginTop: 12, paddingTop: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <span style={{ color: c.textMuted }}>Margem Bruta: <strong style={{ color: margemBruta >= 0 ? c.success : c.danger }}>{margemBruta.toFixed(1)}%</strong></span>
            <span style={{ color: c.textMuted }}>Margem Líquida: <strong style={{ color: margemLiquida >= 0 ? c.success : c.danger }}>{margemLiquida.toFixed(1)}%</strong></span>
            <span style={{ color: c.textMuted }}>ROI: <strong style={{ color: roi >= 0 ? c.success : c.danger }}>{roi.toFixed(1)}%</strong></span>
          </div>
        </div>
      </motion.div>

      {/* Expenses */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card tilt-card"
        style={{ padding: 24, borderRadius: 16, background: c.surface2, border: `1px solid ${c.border}` }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChart size={16} color={c.accent} /> Custos e Despesas
          </h3>
          <button
            onClick={() => setShowAddExpense(!showAddExpense)}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: c.accent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {/* Add form */}
        {showAddExpense && (
          <div style={{ padding: 16, borderRadius: 12, background: c.surface3, border: `1px solid ${c.border}`, marginBottom: 16, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr) auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, display: 'block', marginBottom: 4 }}>Categoria</label>
              <select value={newExpense.category} onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 12 }}>
                {EXPENSE_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, display: 'block', marginBottom: 4 }}>Descrição</label>
              <input value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} placeholder="Ex: Gestor de tráfego" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 12 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, display: 'block', marginBottom: 4 }}>Valor (R$)</label>
              <input type="number" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} placeholder="0,00" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 12, fontFamily: 'JetBrains Mono' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, display: 'block', marginBottom: 4 }}>Data</label>
              <input type="date" value={newExpense.reference_date} onChange={e => setNewExpense(p => ({ ...p, reference_date: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 12 }} />
            </div>
            <button onClick={handleAddExpense} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: c.success, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', height: 36 }}>
              Salvar
            </button>
          </div>
        )}

        {/* Expense list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {expenses.map(expense => {
            const Icon = CATEGORY_ICONS[expense.category] || MoreHorizontal;
            const catLabel = EXPENSE_CATEGORIES.find(c => c.id === expense.category)?.label || expense.category;
            return (
              <div key={expense.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: c.surface3, border: `1px solid ${c.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon size={16} color={c.textMuted} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{expense.description || catLabel}</div>
                    <div style={{ fontSize: 11, color: c.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{catLabel}</span>
                      {expense.is_recurring && <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: c.accent, fontSize: 10 }}>Recorrente</span>}
                      <span><Calendar size={10} /> {new Date(expense.reference_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: c.danger, fontFamily: 'JetBrains Mono' }}>
                    <ArrowDownRight size={14} style={{ marginRight: 4 }} />
                    {formatCurrency(Number(expense.amount))}
                  </span>
                  <button onClick={() => handleDeleteExpense(expense.id)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', color: c.textMuted, cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Category breakdown */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${c.border}` }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: c.textMuted, marginBottom: 12 }}>Breakdown por Categoria</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, val]) => {
                const pct = totalExpenses > 0 ? (val / totalExpenses) * 100 : 0;
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: c.textSecondary, width: 120, flexShrink: 0 }}>
                      {EXPENSE_CATEGORIES.find(ec => ec.id === cat)?.label || cat}
                    </span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: c.surface3 }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: c.accent, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: c.text, fontFamily: 'JetBrains Mono', width: 90, textAlign: 'right' }}>{formatCurrency(val)}</span>
                    <span style={{ fontSize: 11, color: c.textMuted, width: 40, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: c.text, fontFamily: 'JetBrains Mono' }}>
              Total: {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Monthly DRE History (from Supabase view) */}
      {monthlyDRE.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card tilt-card"
          style={{ padding: 24, borderRadius: 16, background: c.surface2, border: `1px solid ${c.border}` }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color={c.accent} /> DRE Mensal (Historico)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Mes', 'Receita Bruta', 'Taxas', 'Reembolsos', 'Receita Liquida'].map((h) => (
                    <th key={h} style={{ textAlign: h === 'Mes' ? 'left' : 'right', padding: '8px 12px', borderBottom: `1px solid ${c.border}`, color: c.textMuted, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyDRE.map((row) => (
                  <tr key={row.month}>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${c.border}`, color: c.text, fontWeight: 600 }}>
                      {row.month}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${c.border}`, color: c.text, textAlign: 'right' }}>
                      {formatCurrency(row.receita_bruta)}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${c.border}`, color: c.danger, textAlign: 'right' }}>
                      {formatCurrency(row.taxas_plataforma)}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${c.border}`, color: c.danger, textAlign: 'right' }}>
                      {formatCurrency(row.reembolsos)}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${c.border}`, color: row.receita_liquida >= 0 ? c.success : c.danger, textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(row.receita_liquida)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
