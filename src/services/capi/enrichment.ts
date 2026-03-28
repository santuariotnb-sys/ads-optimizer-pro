import type { AutoCollectedData, CalculatedData, FunnelValues, CustomerType, FunnelVelocity, MarginTier, FunnelStage } from '../../types/capi';

/**
 * Calcula engagement score (0-10) baseado em comportamento do usuário.
 * Fórmula: (scroll/10 × 0.2) + (min(time/300,1) × 0.3) + (min(video/100,1) × 0.3) + (min(pages/5,1) × 0.2)
 */
export function calculateEngagementScore(data: Partial<AutoCollectedData>): number {
  const scrollComponent = ((data.scroll_depth ?? 0) / 10) * 0.2;
  const timeComponent = Math.min((data.time_on_page ?? 0) / 300, 1) * 0.3;
  const videoComponent = Math.min((data.video_watched_pct ?? 0) / 100, 1) * 0.3;
  const pagesComponent = Math.min((data.pages_viewed_session ?? 0) / 5, 1) * 0.2;

  return Math.round((scrollComponent + timeComponent + videoComponent + pagesComponent) * 10 * 10) / 10;
}

/**
 * Calcula Predicted LTV para infoproduto com funil de bumps/upsells.
 */
export function calculatePredictedLTV(values: FunnelValues): number {
  const front = values.front_end;
  const bump1 = values.bump1_value * (values.bump1_rate / 100);
  const bump2 = values.bump2_value * (values.bump2_rate / 100);
  const upsell = values.upsell_value * (values.upsell_rate / 100);
  const downsell = values.downsell_value * (values.downsell_rate / 100) * (1 - values.upsell_rate / 100);

  return Math.round((front + bump1 + bump2 + upsell + downsell) * 100) / 100;
}

/**
 * Calcula EPV (Earnings Per Visitor) — valor esperado por visitante do funil.
 */
export function calculateEPV(values: FunnelValues, conversionRate: number = 0.03): number {
  return Math.round(calculatePredictedLTV(values) * conversionRate * 100) / 100;
}

/**
 * Classifica tipo de cliente baseado em histórico.
 */
export function classifyCustomer(purchaseCount: number, daysSinceLastPurchase: number, ltvPercentile: number): CustomerType {
  if (ltvPercentile >= 80) return 'vip';
  if (daysSinceLastPurchase > 60 && purchaseCount > 0) return 'at_risk';
  if (purchaseCount > 1) return 'returning';
  return 'new';
}

/**
 * Calcula velocidade do funil (tempo entre primeiro toque e conversão).
 */
export function classifyFunnelVelocity(hoursToConvert: number): FunnelVelocity {
  if (hoursToConvert < 24) return 'fast';
  if (hoursToConvert <= 168) return 'normal';
  return 'slow';
}

/**
 * Classifica margem do produto.
 */
export function classifyMarginTier(marginPercent: number): MarginTier {
  if (marginPercent >= 60) return 'high';
  if (marginPercent >= 30) return 'medium';
  return 'low';
}

/**
 * Determina estágio do funil baseado no último evento.
 */
export function determineFunnelStage(lastEvent: string): FunnelStage {
  const topEvents = ['PageView', 'DeepEngagement'];
  const middleEvents = ['ViewContent', 'Lead', 'VideoEngaged', 'HighIntentVisitor'];
  const bottomEvents = ['InitiateCheckout', 'AddPaymentInfo', 'Purchase'];

  if (topEvents.includes(lastEvent)) return 'top';
  if (middleEvents.includes(lastEvent)) return 'middle';
  if (bottomEvents.includes(lastEvent)) return 'bottom';
  return 'post_purchase';
}

/**
 * Calcula buyer prediction score (0-100).
 * Modelo simples baseado em engagement + velocity + sessions + device.
 */
export function calculateBuyerPredictionScore(
  engagementScore: number,
  velocity: FunnelVelocity,
  sessionCount: number,
  deviceType: 'mobile' | 'desktop' | 'tablet'
): number {
  let score = 0;

  // Engagement (0-40 pontos)
  score += (engagementScore / 10) * 40;

  // Velocity (0-25 pontos)
  const velocityScores: Record<FunnelVelocity, number> = { fast: 25, normal: 15, slow: 5 };
  score += velocityScores[velocity];

  // Sessions (0-20 pontos)
  score += Math.min(sessionCount / 5, 1) * 20;

  // Device (0-15 pontos) — mobile converte menos mas indica interesse real
  const deviceScores: Record<string, number> = { desktop: 15, tablet: 12, mobile: 10 };
  score += deviceScores[deviceType] ?? 10;

  return Math.round(Math.min(score, 100));
}

/**
 * Enriquece dados coletados com cálculos server-side.
 */
export function enrichEventData(
  collected: Partial<AutoCollectedData>,
  funnelValues: FunnelValues,
  lastEvent: string,
  purchaseCount: number = 0,
  daysSinceLastPurchase: number = 0,
  ltvPercentile: number = 50,
  marginPercent: number = 50,
  hoursToConvert: number = 48
): CalculatedData {
  const engagementScore = calculateEngagementScore(collected);
  const velocity = classifyFunnelVelocity(hoursToConvert);

  return {
    engagement_score: engagementScore,
    predicted_ltv: calculatePredictedLTV(funnelValues),
    customer_type: classifyCustomer(purchaseCount, daysSinceLastPurchase, ltvPercentile),
    margin_tier: classifyMarginTier(marginPercent),
    funnel_velocity: velocity,
    buyer_prediction_score: calculateBuyerPredictionScore(
      engagementScore,
      velocity,
      collected.session_count ?? 1,
      collected.device_type ?? 'mobile'
    ),
    funnel_stage: determineFunnelStage(lastEvent),
  };
}
