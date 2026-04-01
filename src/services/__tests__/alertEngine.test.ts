import { describe, it, expect } from 'vitest';
import { evaluateAlerts } from '../alertEngine';
import type { Campaign } from '../../types/meta';

const baseCampaign: Campaign = {
  id: 'test-1', name: 'Test Campaign', status: 'ACTIVE',
  objective: 'OUTCOME_SALES', daily_budget: 100, lifetime_budget: 0,
  roas: 3.0, cpa: 50, cpm: 40, ctr: 2.0, spend: 5000,
  conversions: 100, impressions: 125000, clicks: 2500,
  frequency: 1.5, opportunity_score: 75, created_time: '2026-03-01',
};

describe('evaluateAlerts', () => {
  it('generates winner alert for high-score campaigns', () => {
    const campaign = { ...baseCampaign, opportunity_score: 85, cpa: 40 };
    const alerts = evaluateAlerts([campaign], 8.5);
    const winner = alerts.find(a => a.type === 'winner');
    expect(winner).toBeDefined();
    expect(winner?.severity).toBe('success');
  });

  it('generates frequency alert when too high', () => {
    const campaign = { ...baseCampaign, frequency: 3.5 };
    const alerts = evaluateAlerts([campaign], 8.5);
    const freq = alerts.find(a => a.type === 'frequency');
    expect(freq).toBeDefined();
    expect(freq?.severity).toBe('warning');
  });

  it('generates EMQ alert when below threshold', () => {
    const alerts = evaluateAlerts([baseCampaign], 6.5);
    const emq = alerts.find(a => a.type === 'emq');
    expect(emq).toBeDefined();
    expect(emq?.severity).toBe('warning');
  });

  it('generates ROAS alert for negative campaigns', () => {
    const campaign = { ...baseCampaign, roas: 0.7, opportunity_score: 30, status: 'ACTIVE' as const };
    const alerts = evaluateAlerts([campaign], 8.5);
    const roas = alerts.find(a => a.type === 'roas_low');
    expect(roas).toBeDefined();
  });

  it('generates learning alert for extended learning', () => {
    const campaign = { ...baseCampaign, learning_days: 16 };
    const alerts = evaluateAlerts([campaign], 8.5);
    const learning = alerts.find(a => a.type === 'learning');
    expect(learning).toBeDefined();
  });

  it('does not alert for healthy campaigns', () => {
    const alerts = evaluateAlerts([baseCampaign], 8.5);
    const critical = alerts.filter(a => a.severity === 'critical');
    expect(critical).toHaveLength(0);
  });
});
