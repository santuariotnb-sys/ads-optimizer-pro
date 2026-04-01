import type { BrowserEvent, ValidationResult } from './types.ts';

const VALID_EVENTS = new Set([
  'PageView', 'ViewContent', 'Lead', 'InitiateCheckout',
  'AddPaymentInfo', 'Purchase', 'AddToCart', 'AddToWishlist',
  'Search', 'CompleteRegistration',
  'AppActivation', 'ContentCompleted', 'ProtocolCompleted',
  'ScheduledCall', 'CallCompleted',
]);

const BLOCKED_EVENTS = new Set([
  'PredictedBuyer', 'ChurnRisk', 'HighEngagement',
  'BuyerScore', 'FatigueAlert', 'AuctionPressure',
]);

// Synthetic events from Signal Engine — stored for analytics but NOT forwarded to Meta CAPI
const SYNTHETIC_EVENTS = new Set([
  'DeepEngagement', 'HighIntentVisitor', 'VideoEngaged',
  'QualifiedLead', 'HighValuePurchase', 'UpsellCandidate', 'RepeatPurchase',
  'PageLeave',
]);

export function isSyntheticEvent(event: BrowserEvent): boolean {
  return SYNTHETIC_EVENTS.has(event.event_name) || event.is_synthetic === true;
}

export function validateEvent(event: BrowserEvent): ValidationResult {
  if (BLOCKED_EVENTS.has(event.event_name)) {
    return { valid: false, reason: `'${event.event_name}' é score interno, não evento real` };
  }

  // Allow synthetic events — they will be stored but not sent to Meta
  if (isSyntheticEvent(event)) {
    return { valid: true, reason: null };
  }

  if (!VALID_EVENTS.has(event.event_name) && !event.event_name.startsWith('custom_')) {
    return { valid: false, reason: `Event name '${event.event_name}' não é válido` };
  }

  if (event.event_name === 'Purchase') {
    if (!event.conversion?.value || event.conversion.value <= 0) {
      return { valid: false, reason: 'Purchase sem value monetário real' };
    }
  }

  if (!event.event_id || event.event_id.length < 10) {
    return { valid: false, reason: 'event_id ausente ou muito curto' };
  }

  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  if (Math.abs(now - event.timestamp) > maxAge) {
    return { valid: false, reason: 'Timestamp muito antigo ou futuro' };
  }

  try {
    new URL(event.event_source_url);
  } catch {
    return { valid: false, reason: 'event_source_url inválida' };
  }

  return { valid: true, reason: null };
}
