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
  if (change > 0) return '#22c55e';
  if (change < 0) return '#ef4444';
  return '#737373';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE': return '#22c55e';
    case 'PAUSED': return '#525252';
    case 'LEARNING': return '#eab308';
    case 'LEARNING_LIMITED': return '#ef4444';
    default: return '#525252';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bom';
  if (score >= 40) return 'Regular';
  return 'Crítico';
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'warning': return '#eab308';
    case 'info': return '#06b6d4';
    case 'success': return '#22c55e';
    default: return '#737373';
  }
}
