export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('pt-BR');
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
}

export function getChangeColor(change: number): string {
  if (change > 0) return '#4ade80';
  if (change < 0) return '#f87171';
  return '#64748b';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE': return '#4ade80';
    case 'PAUSED': return '#64748b';
    case 'LEARNING': return '#facc15';
    case 'LEARNING_LIMITED': return '#f87171';
    default: return '#64748b';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#facc15';
  if (score >= 40) return '#f97316';
  return '#f87171';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bom';
  if (score >= 40) return 'Regular';
  return 'Crítico';
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#f87171';
    case 'warning': return '#facc15';
    case 'info': return '#60a5fa';
    case 'success': return '#4ade80';
    default: return '#737373';
  }
}
