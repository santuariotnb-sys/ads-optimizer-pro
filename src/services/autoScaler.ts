import type { Campaign } from '../types/meta';
import { AUTO_SCALE } from '../utils/constants';

export interface ScaleAction {
  type: 'scale_up' | 'pause_ad' | 'pause_adset';
  target_id: string;
  target_name: string;
  reason: string;
  new_budget?: number;
}

export function evaluateAutoScale(campaigns: Campaign[], cpaTarget: number): ScaleAction[] {
  const actions: ScaleAction[] = [];

  for (const campaign of campaigns) {
    // Auto-scale: CPA below target for 48h+ (simplified: check current CPA)
    if (campaign.cpa < cpaTarget && campaign.status === 'ACTIVE' && campaign.opportunity_score >= 70) {
      const increase = campaign.daily_budget * (1 + AUTO_SCALE.MAX_BUDGET_CHANGE_PCT / 100);
      actions.push({
        type: 'scale_up',
        target_id: campaign.id,
        target_name: campaign.name,
        reason: `CPA R$ ${campaign.cpa.toFixed(2)} abaixo do alvo R$ ${cpaTarget.toFixed(2)}`,
        new_budget: Math.round(increase),
      });
    }

    // Auto-pause: CPA > 2x target
    if (campaign.cpa > cpaTarget * 2 && campaign.status === 'ACTIVE') {
      actions.push({
        type: 'pause_adset',
        target_id: campaign.id,
        target_name: campaign.name,
        reason: `CPA R$ ${campaign.cpa.toFixed(2)} é ${(campaign.cpa / cpaTarget).toFixed(1)}x o alvo`,
      });
    }

    // Auto-pause: CTR < 1% after 7+ days with low conversions
    if (campaign.ctr < 1 && campaign.conversions < 5 && campaign.status === 'ACTIVE') {
      actions.push({
        type: 'pause_ad',
        target_id: campaign.id,
        target_name: campaign.name,
        reason: `CTR ${campaign.ctr.toFixed(1)}% com apenas ${campaign.conversions} conversões`,
      });
    }
  }

  return actions;
}
