import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatNumber, getStatusColor, getScoreColor, getScoreLabel, getSeverityColor } from '../formatters';

describe('formatCurrency', () => {
  it('formats BRL currency', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1.234,56');
    expect(result).toContain('R$');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toContain('0,00');
  });
});

describe('formatPercent', () => {
  it('formats positive with +', () => {
    expect(formatPercent(12.5)).toBe('+12.5%');
  });

  it('formats negative', () => {
    expect(formatPercent(-8.3)).toBe('-8.3%');
  });
});

describe('formatNumber', () => {
  it('formats millions', () => {
    expect(formatNumber(1500000)).toBe('1.5M');
  });

  it('formats thousands', () => {
    expect(formatNumber(42000)).toBe('42.0K');
  });

  it('formats small numbers', () => {
    const result = formatNumber(123);
    expect(result).toBeTruthy();
  });
});

describe('getStatusColor', () => {
  it('returns green for ACTIVE', () => {
    expect(getStatusColor('ACTIVE')).toBe('#4ade80');
  });

  it('returns yellow for LEARNING', () => {
    expect(getStatusColor('LEARNING')).toBe('#facc15');
  });

  it('returns red for LEARNING_LIMITED', () => {
    expect(getStatusColor('LEARNING_LIMITED')).toBe('#f87171');
  });

  it('returns muted for PAUSED', () => {
    expect(getStatusColor('PAUSED')).toBe('#64748b');
  });
});

describe('getScoreColor', () => {
  it('returns green for high scores', () => {
    expect(getScoreColor(85)).toBe('#4ade80');
  });

  it('returns yellow for medium scores', () => {
    expect(getScoreColor(65)).toBe('#facc15');
  });

  it('returns red for low scores', () => {
    expect(getScoreColor(30)).toBe('#f87171');
  });
});

describe('getScoreLabel', () => {
  it('returns correct labels', () => {
    expect(getScoreLabel(90)).toBe('Excelente');
    expect(getScoreLabel(70)).toBe('Bom');
    expect(getScoreLabel(50)).toBe('Regular');
    expect(getScoreLabel(20)).toBe('Crítico');
  });
});

describe('getSeverityColor', () => {
  it('returns correct colors', () => {
    expect(getSeverityColor('critical')).toBe('#f87171');
    expect(getSeverityColor('warning')).toBe('#facc15');
    expect(getSeverityColor('info')).toBe('#60a5fa');
    expect(getSeverityColor('success')).toBe('#4ade80');
  });
});
