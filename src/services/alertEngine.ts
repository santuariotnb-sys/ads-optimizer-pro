import type { Campaign, Alert } from '../types/meta';
import { ALERT_THRESHOLDS } from '../utils/constants';

let alertCounter = 100;

function createAlert(partial: Omit<Alert, 'id' | 'dismissed'>): Alert {
  return { ...partial, id: `auto_${++alertCounter}`, dismissed: false };
}

export function evaluateAlerts(campaigns: Campaign[], emqScore: number): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  for (const campaign of campaigns) {
    if (campaign.cpa > 0 && campaign.opportunity_score < ALERT_THRESHOLDS.OPPORTUNITY_SCORE_MIN) {
      if (campaign.roas < ALERT_THRESHOLDS.ROAS_MIN && campaign.status === 'ACTIVE') {
        alerts.push(createAlert({
          type: 'roas_low', severity: 'critical',
          title: `ROAS negativo — ${campaign.name}`,
          message: `ROAS ${campaign.roas.toFixed(2)}x está abaixo de 1.0. Campanha operando no prejuízo.`,
          timestamp: now, campaign_id: campaign.id,
        }));
      }
    }

    if (campaign.frequency > ALERT_THRESHOLDS.FREQUENCY_MAX) {
      alerts.push(createAlert({
        type: 'frequency', severity: 'warning',
        title: `Frequência alta — ${campaign.name}`,
        message: `Frequência ${campaign.frequency.toFixed(1)} excede o limite de ${ALERT_THRESHOLDS.FREQUENCY_MAX}. Expandir público ou pausar.`,
        timestamp: now, campaign_id: campaign.id,
      }));
    }

    if (campaign.learning_days && campaign.learning_days > ALERT_THRESHOLDS.LEARNING_MAX_DAYS) {
      alerts.push(createAlert({
        type: 'learning', severity: 'info',
        title: `Learning prolongada — ${campaign.name}`,
        message: `${campaign.learning_days} dias em learning phase. Consolidar ad sets para atingir 50 conv/semana.`,
        timestamp: now, campaign_id: campaign.id,
      }));
    }

    if (campaign.opportunity_score >= 80 && campaign.cpa < 55 && campaign.status === 'ACTIVE') {
      alerts.push(createAlert({
        type: 'winner', severity: 'success',
        title: `Winner — ${campaign.name}`,
        message: `Score ${campaign.opportunity_score}, CPA R$ ${campaign.cpa.toFixed(2)}. Considere escalar +10%.`,
        timestamp: now, campaign_id: campaign.id,
      }));
    }
  }

  if (emqScore < ALERT_THRESHOLDS.EMQ_MIN) {
    alerts.push(createAlert({
      type: 'emq', severity: 'critical',
      title: 'EMQ abaixo do mínimo',
      message: `EMQ ${emqScore.toFixed(1)} está abaixo de ${ALERT_THRESHOLDS.EMQ_MIN}. Verifique integração CAPI.`,
      timestamp: now,
    }));
  }

  return alerts;
}
