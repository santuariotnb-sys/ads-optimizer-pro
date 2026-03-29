import { supabase } from '../lib/supabase';

export interface SalesSummary {
  totalSales: number;
  pendingSales: number;
  refundedSales: number;
  grossRevenue: number;
  netRevenue: number;
  totalCommission: number;
  refundedAmount: number;
  avgTicket: number;
}

export interface SalesByDay {
  date: string;
  sales: number;
  revenue: number;
}

export interface UTMBreakdown {
  utm_source: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  vendas: number;
  receita: number;
  ticket_medio: number;
}

interface SaleRow {
  status: string;
  amount: number;
  net_amount: number | null;
  commission: number | null;
  sale_date: string;
  utm_source: string | null;
}

function getDateRange(period: string): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  switch (period) {
    case 'today': break;
    case '7d': start.setDate(start.getDate() - 7); break;
    case '14d': start.setDate(start.getDate() - 14); break;
    case '30d': start.setDate(start.getDate() - 30); break;
    default: start.setDate(start.getDate() - 7);
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function fetchSales(period: string, filters?: { status?: string; utm_source?: string }) {
  const { start, end } = getDateRange(period);
  let query = supabase
    .from('sales')
    .select('*')
    .gte('sale_date', start)
    .lte('sale_date', end)
    .order('sale_date', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.utm_source) query = query.eq('utm_source', filters.utm_source);

  const { data, error } = await query;
  if (error) throw error;
  return data as SaleRow[];
}

export async function getSalesSummary(period: string): Promise<SalesSummary> {
  const { start, end } = getDateRange(period);
  const { data, error } = await supabase
    .from('sales')
    .select('status, amount, net_amount, commission')
    .gte('sale_date', start)
    .lte('sale_date', end);

  if (error) throw error;
  const rows = (data || []) as SaleRow[];

  const approved = rows.filter(r => r.status === 'approved');
  const refunded = rows.filter(r => r.status === 'refunded');
  const pending = rows.filter(r => r.status === 'pending');

  const grossRevenue = approved.reduce((sum, r) => sum + Number(r.amount), 0);

  return {
    totalSales: approved.length,
    pendingSales: pending.length,
    refundedSales: refunded.length,
    grossRevenue,
    netRevenue: approved.reduce((sum, r) => sum + Number(r.net_amount || r.amount), 0),
    totalCommission: approved.reduce((sum, r) => sum + Number(r.commission || 0), 0),
    refundedAmount: refunded.reduce((sum, r) => sum + Number(r.amount), 0),
    avgTicket: approved.length > 0 ? grossRevenue / approved.length : 0,
  };
}

export async function getSalesByDay(period: string): Promise<SalesByDay[]> {
  const { start, end } = getDateRange(period);
  const { data, error } = await supabase
    .from('sales')
    .select('sale_date, amount, status')
    .eq('status', 'approved')
    .gte('sale_date', start)
    .lte('sale_date', end)
    .order('sale_date', { ascending: true });

  if (error) throw error;

  const byDay = new Map<string, SalesByDay>();
  for (const row of (data || []) as SaleRow[]) {
    const date = row.sale_date.split('T')[0];
    const existing = byDay.get(date) || { date, sales: 0, revenue: 0 };
    existing.sales += 1;
    existing.revenue += Number(row.amount);
    byDay.set(date, existing);
  }
  return Array.from(byDay.values());
}

export async function getUTMBreakdown(): Promise<UTMBreakdown[]> {
  const { data, error } = await supabase
    .from('utm_ranking')
    .select('*')
    .order('receita', { ascending: false });

  if (error) throw error;
  return (data || []) as UTMBreakdown[];
}
