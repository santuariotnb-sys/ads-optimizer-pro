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
    // ROAS abaixo do mínimo (1.0) — campanha no prejuízo
    if (campaign.roas < ALERT_THRESHOLDS.ROAS_MIN && campaign.status === 'ACTIVE') {
      alerts.push(createAlert({
        type: 'roas_low', severity: 'critical',
        title: `ROAS negativo — ${campaign.name}`,
        message: `ROAS ${campaign.roas.toFixed(2)}x está abaixo de ${ALERT_THRESHOLDS.ROAS_MIN}. Campanha operando no prejuízo.`,
        timestamp: now, campaign_id: campaign.id,
      }));
    }

    // CTR abaixo do mínimo (1%)
    if (campaign.ctr < ALERT_THRESHOLDS.CTR_MIN && campaign.status === 'ACTIVE') {
      alerts.push(createAlert({
        type: 'ctr_low', severity: 'warning',
        title: `CTR baixo — ${campaign.name}`,
        message: `CTR ${campaign.ctr.toFixed(1)}% está abaixo de ${ALERT_THRESHOLDS.CTR_MIN}%. Revisar criativos e copy.`,
        timestamp: now, campaign_id: campaign.id,
      }));
    }

    // CPA aumentou +25% (comparação com budget alvo)
    if (campaign.cpa > 0 && campaign.daily_budget > 0) {
      const cpaBenchmark = campaign.daily_budget * 0.6;
      const cpaIncrease = ((campaign.cpa - cpaBenchmark) / cpaBenchmark) * 100;
      if (cpaIncrease > ALERT_THRESHOLDS.CPA_INCREASE_PCT && campaign.status === 'ACTIVE') {
        alerts.push(createAlert({
          type: 'cpa_spike', severity: 'critical',
          title: `CPA disparou — ${campaign.name}`,
          message: `CPA R$ ${campaign.cpa.toFixed(2)} subiu ${cpaIncrease.toFixed(0)}% acima do benchmark. Avaliar segmentação e criativos.`,
          timestamp: now, campaign_id: campaign.id,
        }));
      }
    }

    // CPM subiu +30% — sinal de fadiga de criativo
    if (campaign.cpm > 0) {
      const cpmBenchmark = 45;
      const cpmIncrease = ((campaign.cpm - cpmBenchmark) / cpmBenchmark) * 100;
      if (cpmIncrease > ALERT_THRESHOLDS.CPM_INCREASE_PCT && campaign.status === 'ACTIVE') {
        alerts.push(createAlert({
          type: 'cpm_fatigue', severity: 'warning',
          title: `Fadiga de criativo — ${campaign.name}`,
          message: `CPM R$ ${campaign.cpm.toFixed(2)} subiu ${cpmIncrease.toFixed(0)}% — público saturado. Rotacionar criativos.`,
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
