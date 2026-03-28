import type { SyntheticEventRule, SyntheticCondition } from '../../types/capi';

/**
 * Avalia uma condição contra um contexto de dados.
 */
function evaluateCondition(condition: SyntheticCondition, context: Record<string, unknown>): boolean {
  const fieldValue = context[condition.field];
  if (fieldValue === undefined) return false;

  const { operator, value } = condition;

  switch (operator) {
    case '>=': return Number(fieldValue) >= Number(value);
    case '<=': return Number(fieldValue) <= Number(value);
    case '>':  return Number(fieldValue) > Number(value);
    case '<':  return Number(fieldValue) < Number(value);
    case '==': return fieldValue === value;
    case '!=': return fieldValue !== value;
    default: return false;
  }
}

/**
 * Verifica se todas as condições de uma regra são satisfeitas (AND lógico).
 */
export function evaluateRule(rule: SyntheticEventRule, context: Record<string, unknown>): boolean {
  if (!rule.enabled) return false;
  return rule.conditions.every(c => evaluateCondition(c, context));
}

/**
 * Avalia todas as regras e retorna as que devem disparar.
 */
export function evaluateAllRules(
  rules: SyntheticEventRule[],
  context: Record<string, unknown>
): SyntheticEventRule[] {
  return rules.filter(rule => evaluateRule(rule, context));
}

/**
 * Regras sintéticas padrão pré-configuradas.
 */
export const DEFAULT_SYNTHETIC_RULES: SyntheticEventRule[] = [
  {
    id: 'syn_001',
    event_name: 'DeepEngagement',
    description: 'Visitante com engajamento profundo na página',
    conditions: [
      { field: 'scroll_depth', operator: '>=', value: 75 },
      { field: 'time_on_page', operator: '>=', value: 120 },
    ],
    cooldown_hours: 24,
    enabled: true,
    fires_24h: 342,
    fire_rate: 68,
  },
  {
    id: 'syn_002',
    event_name: 'HighIntentVisitor',
    description: 'Visitante que retornou à LP múltiplas vezes',
    conditions: [
      { field: 'session_count', operator: '>=', value: 3 },
      { field: 'time_since_first_visit', operator: '<=', value: 172800 },
    ],
    cooldown_hours: 48,
    enabled: true,
    fires_24h: 124,
    fire_rate: 25,
  },
  {
    id: 'syn_003',
    event_name: 'VideoEngaged',
    description: 'Assistiu VSL/vídeo de vendas significativamente',
    conditions: [
      { field: 'video_watched_pct', operator: '>=', value: 50 },
    ],
    cooldown_hours: 24,
    enabled: true,
    fires_24h: 156,
    fire_rate: 31,
  },
  {
    id: 'syn_004',
    event_name: 'PredictedBuyer',
    description: 'Sistema calcula alta probabilidade de compra',
    conditions: [
      { field: 'buyer_prediction_score', operator: '>=', value: 80 },
    ],
    value_multiplier: 0.5,
    cooldown_hours: 72,
    enabled: true,
    fires_24h: 87,
    fire_rate: 17,
  },
  {
    id: 'syn_005',
    event_name: 'QualifiedLead',
    description: 'Lead com sinais de qualificação',
    conditions: [
      { field: 'has_email', operator: '==', value: true },
      { field: 'engagement_score', operator: '>=', value: 6 },
    ],
    cooldown_hours: 168,
    enabled: true,
    fires_24h: 63,
    fire_rate: 13,
  },
  {
    id: 'syn_006',
    event_name: 'HighValuePurchase',
    description: 'Compra acima do ticket médio',
    conditions: [
      { field: 'purchase_value', operator: '>=', value: 150 },
    ],
    cooldown_hours: 0,
    enabled: true,
    fires_24h: 18,
    fire_rate: 4,
  },
  {
    id: 'syn_007',
    event_name: 'UpsellCandidate',
    description: 'Comprou front + bump = provável comprador de upsell',
    conditions: [
      { field: 'has_purchased_front', operator: '==', value: true },
      { field: 'bump_accepted', operator: '==', value: true },
    ],
    cooldown_hours: 0,
    enabled: true,
    fires_24h: 9,
    fire_rate: 2,
  },
  {
    id: 'syn_008',
    event_name: 'RepeatPurchase',
    description: 'Cliente fez 2ª compra',
    conditions: [
      { field: 'purchase_count', operator: '>=', value: 2 },
    ],
    cooldown_hours: 0,
    enabled: false,
    fires_24h: 0,
    fire_rate: 0,
  },
  {
    id: 'syn_009',
    event_name: 'ContentCompleted',
    description: 'Consumiu conteúdo principal (curso/protocolo/onboarding)',
    conditions: [
      { field: 'content_consumed', operator: '>=', value: 90 },
    ],
    cooldown_hours: 0,
    enabled: false,
    fires_24h: 0,
    fire_rate: 0,
  },
  {
    id: 'syn_010',
    event_name: 'ChurnRisk',
    description: 'Cliente não acessou produto há 14+ dias (sinal negativo)',
    conditions: [
      { field: 'days_since_last_access', operator: '>=', value: 14 },
      { field: 'content_consumed', operator: '<', value: 50 },
    ],
    cooldown_hours: 168,
    enabled: false,
    fires_24h: 0,
    fire_rate: 0,
  },
];
