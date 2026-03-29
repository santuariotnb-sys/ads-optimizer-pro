import { supabase } from '../lib/supabase';

export interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  is_recurring: boolean;
  recurring_day: number | null;
  reference_date: string;
}

export interface ExpenseInput {
  category: string;
  description?: string;
  amount: number;
  is_recurring?: boolean;
  recurring_day?: number;
  reference_date: string;
}

export const EXPENSE_CATEGORIES = [
  { id: 'meta_ads', label: 'Meta Ads', icon: 'Facebook' },
  { id: 'google_ads', label: 'Google Ads', icon: 'Search' },
  { id: 'tiktok_ads', label: 'TikTok Ads', icon: 'Video' },
  { id: 'equipe', label: 'Equipe', icon: 'Users' },
  { id: 'ferramentas', label: 'Ferramentas', icon: 'Wrench' },
  { id: 'criativos', label: 'Criativos', icon: 'Palette' },
  { id: 'hospedagem', label: 'Hospedagem/Domínio', icon: 'Server' },
  { id: 'impostos', label: 'Impostos/Taxas', icon: 'Receipt' },
  { id: 'outros', label: 'Outros', icon: 'MoreHorizontal' },
] as const;

export async function fetchExpenses(month: string): Promise<Expense[]> {
  const startDate = `${month}-01`;
  const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1))
    .toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .gte('reference_date', startDate)
    .lt('reference_date', endDate)
    .order('reference_date', { ascending: false });

  if (error) throw error;
  return (data || []) as Expense[];
}

export async function createExpense(input: ExpenseInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...input, user_id: user.id } as Record<string, unknown>)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateExpense(id: string, input: Partial<ExpenseInput>) {
  const { data, error } = await supabase
    .from('expenses')
    .update(input as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function getExpenseSummary(month: string) {
  const expenses = await fetchExpenses(month);
  const byCategory = new Map<string, number>();

  for (const expense of expenses) {
    const current = byCategory.get(expense.category) || 0;
    byCategory.set(expense.category, current + Number(expense.amount));
  }

  return {
    total: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    byCategory: Object.fromEntries(byCategory),
    count: expenses.length,
  };
}
