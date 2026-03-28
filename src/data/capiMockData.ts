import type { FunnelConfig, ValueRule, CAPIEventLog, EMQAnalysis, CAPIEventPayload, CAPIState } from '../types/capi';
import { DEFAULT_SYNTHETIC_RULES } from '../services/capi/synthetic';

// ── Mock Funnel Config (Infoproduto) ──

export const mockFunnelConfig: FunnelConfig = {
  id: 'funnel_001',
  name: 'Protocolo Detox — Funil Principal',
  type: 'infoproduto',
  pixel_id: '',
  access_token: '',
  events: [
    { id: 'ev_01', event_name: 'PageView', display_name: 'PageView (LP)', is_synthetic: false, enabled: true, description: 'Visitou a landing page' },
    { id: 'ev_02', event_name: 'DeepEngagement', display_name: 'Deep Engagement', is_synthetic: true, enabled: true, description: 'Scroll >75% + tempo >2min' },
    { id: 'ev_03', event_name: 'ViewContent', display_name: 'ViewContent (VSL)', is_synthetic: false, enabled: true, description: 'VSL assistido 50%+' },
    { id: 'ev_04', event_name: 'Lead', display_name: 'Lead (Email)', is_synthetic: false, enabled: true, description: 'Capturou email' },
    { id: 'ev_05', event_name: 'InitiateCheckout', display_name: 'Initiate Checkout', is_synthetic: false, enabled: true, description: 'Clicou botão comprar' },
    { id: 'ev_06', event_name: 'Purchase', display_name: 'Purchase (Front)', is_synthetic: false, enabled: true, description: 'Compra do front-end', default_value: 37 },
    { id: 'ev_07', event_name: 'Purchase', display_name: 'Purchase (Bump)', is_synthetic: false, enabled: true, description: 'Comprou bump', default_value: 49.99 },
    { id: 'ev_08', event_name: 'Purchase', display_name: 'Purchase (Upsell)', is_synthetic: false, enabled: true, description: 'Comprou upsell', default_value: 116.99 },
    { id: 'ev_09', event_name: 'AppActivation', display_name: 'App Activation', is_synthetic: true, enabled: true, description: 'Acessou área de membros' },
    { id: 'ev_10', event_name: 'ContentCompleted', display_name: 'Content Completed', is_synthetic: true, enabled: false, description: 'Consumiu 90%+ do conteúdo' },
    { id: 'ev_11', event_name: 'Refund', display_name: 'Refund (Negativo)', is_synthetic: false, enabled: true, description: 'Reembolso — sinal negativo' },
  ],
  values: {
    front_end: 37.00,
    bump1_value: 12.99,
    bump1_rate: 35,
    bump2_value: 12.99,
    bump2_rate: 25,
    upsell_value: 67.00,
    upsell_rate: 20,
    downsell_value: 42.00,
    downsell_rate: 15,
  },
  predicted_ltv: 63.24,
  epv: 1.90,
  created_at: '2026-03-15T10:00:00Z',
  updated_at: '2026-03-28T08:00:00Z',
};

// ── Mock Value Rules ──

export const mockValueRules: ValueRule[] = [
  {
    id: 'vr_001',
    name: 'Novos Clientes +30%',
    conditions: { customer_type: 'new' },
    bid_multiplier: 1.3,
    enabled: true,
  },
  {
    id: 'vr_002',
    name: 'Mulheres 35-54 +75%',
    conditions: { gender: 'female', age_range: { min: 35, max: 54 } },
    bid_multiplier: 1.75,
    enabled: true,
  },
  {
    id: 'vr_003',
    name: 'Returning -30%',
    conditions: { customer_type: 'returning' },
    bid_multiplier: 0.7,
    enabled: false,
  },
  {
    id: 'vr_004',
    name: 'VIP Customers +50%',
    conditions: { customer_type: 'vip' },
    bid_multiplier: 1.5,
    enabled: true,
  },
];

// ── Mock Event Logs ──

export const mockEventLogs: CAPIEventLog[] = [
  { id: 'evt_1711612800_a1b2c3d4', event_name: 'Purchase', event_id: 'evt_1711612800_a1b2c3d4', timestamp: '2026-03-28T09:20:00Z', status: 'sent', response_code: 200, user_data_fields: ['em', 'ph', 'external_id', 'client_ip_address', 'client_user_agent', 'fbp'], custom_data_fields: ['value', 'currency', 'predicted_ltv', 'customer_type', 'engagement_score', 'margin_tier'], is_synthetic: false, value: 37.00, emq_contribution: 8.0 },
  { id: 'evt_1711612801_e5f6g7h8', event_name: 'DeepEngagement', event_id: 'evt_1711612801_e5f6g7h8', timestamp: '2026-03-28T09:18:00Z', status: 'sent', response_code: 200, user_data_fields: ['external_id', 'client_ip_address', 'client_user_agent', 'fbp'], custom_data_fields: ['engagement_score', 'scroll_depth', 'time_on_page', 'session_count'], is_synthetic: true, emq_contribution: 5.5 },
  { id: 'evt_1711612802_i9j0k1l2', event_name: 'PredictedBuyer', event_id: 'evt_1711612802_i9j0k1l2', timestamp: '2026-03-28T09:15:00Z', status: 'sent', response_code: 200, user_data_fields: ['em', 'external_id', 'client_ip_address', 'client_user_agent'], custom_data_fields: ['buyer_prediction_score', 'predicted_ltv', 'engagement_score', 'funnel_velocity'], is_synthetic: true, value: 31.62, emq_contribution: 6.5 },
  { id: 'evt_1711612803_m3n4o5p6', event_name: 'InitiateCheckout', event_id: 'evt_1711612803_m3n4o5p6', timestamp: '2026-03-28T09:12:00Z', status: 'sent', response_code: 200, user_data_fields: ['em', 'ph', 'external_id', 'client_ip_address', 'client_user_agent', 'fbp', 'fbc'], custom_data_fields: ['value', 'currency', 'predicted_ltv', 'customer_type', 'funnel_stage'], is_synthetic: false, value: 37.00, emq_contribution: 8.5 },
  { id: 'evt_1711612804_q7r8s9t0', event_name: 'Lead', event_id: 'evt_1711612804_q7r8s9t0', timestamp: '2026-03-28T09:08:00Z', status: 'sent', response_code: 200, user_data_fields: ['em', 'client_ip_address', 'client_user_agent', 'fbp'], custom_data_fields: ['engagement_score', 'funnel_stage'], is_synthetic: false, emq_contribution: 5.0 },
  { id: 'evt_1711612805_u1v2w3x4', event_name: 'VideoEngaged', event_id: 'evt_1711612805_u1v2w3x4', timestamp: '2026-03-28T09:05:00Z', status: 'sent', response_code: 200, user_data_fields: ['client_ip_address', 'client_user_agent', 'fbp'], custom_data_fields: ['video_watched', 'time_on_page', 'engagement_score'], is_synthetic: true, emq_contribution: 3.0 },
  { id: 'evt_1711612806_y5z6a7b8', event_name: 'PageView', event_id: 'evt_1711612806_y5z6a7b8', timestamp: '2026-03-28T09:00:00Z', status: 'sent', response_code: 200, user_data_fields: ['client_ip_address', 'client_user_agent', 'fbp'], custom_data_fields: ['funnel_stage'], is_synthetic: false, emq_contribution: 3.0 },
  { id: 'evt_1711612807_c9d0e1f2', event_name: 'Purchase', event_id: 'evt_1711612807_c9d0e1f2', timestamp: '2026-03-28T08:45:00Z', status: 'failed', response_code: 500, user_data_fields: ['em', 'ph', 'external_id'], custom_data_fields: ['value', 'currency', 'predicted_ltv'], is_synthetic: false, value: 67.00, emq_contribution: 7.0 },
];

// ── Mock EMQ Analysis ──

export const mockEMQAnalysis: EMQAnalysis = {
  overall_score: 8.7,
  parameters: [
    { key: 'email', label: 'E-mail (em)', present: true, estimated_impact: 2.0, max_impact: 2.0 },
    { key: 'phone', label: 'Telefone (ph)', present: true, estimated_impact: 1.5, max_impact: 1.5 },
    { key: 'external_id', label: 'External ID', present: true, estimated_impact: 1.5, max_impact: 1.5 },
    { key: 'ip_address', label: 'IP Address', present: true, estimated_impact: 0.5, max_impact: 0.5 },
    { key: 'user_agent', label: 'User Agent', present: true, estimated_impact: 0.5, max_impact: 0.5 },
    { key: 'fbp', label: 'FB Pixel (_fbp)', present: true, estimated_impact: 0.5, max_impact: 0.5 },
    { key: 'fbc', label: 'FB Click (_fbc)', present: true, estimated_impact: 0.4, max_impact: 0.5 },
    { key: 'first_name', label: 'Nome', present: true, estimated_impact: 0.3, max_impact: 0.3 },
    { key: 'last_name', label: 'Sobrenome', present: true, estimated_impact: 0.3, max_impact: 0.3 },
    { key: 'city', label: 'Cidade', present: true, estimated_impact: 0.2, max_impact: 0.2 },
    { key: 'state', label: 'Estado', present: true, estimated_impact: 0.2, max_impact: 0.2 },
    { key: 'zip', label: 'CEP', present: false, estimated_impact: 0, max_impact: 0.2 },
    { key: 'country', label: 'País', present: true, estimated_impact: 0.2, max_impact: 0.2 },
    { key: 'gender', label: 'Gênero', present: false, estimated_impact: 0, max_impact: 0.1 },
    { key: 'date_of_birth', label: 'Data Nasc.', present: false, estimated_impact: 0, max_impact: 0.1 },
  ],
  level: 'excellent',
  recommendation: 'EMQ excelente. Andromeda operando em modo completo. Monitore semanalmente.',
};

// ── Mock CAPI Event (for payload preview) ──

export const mockCAPIEvent: CAPIEventPayload = {
  event_name: 'Purchase',
  event_time: 1711612800,
  event_id: 'evt_1711612800_a1b2c3d4',
  event_source_url: 'https://checkout.exemplo.com/obrigado',
  action_source: 'website',
  opt_out: false,
  user_data: {
    em: ['a3f5c7d8e1b2...'],
    ph: ['b4g6h8i2j3k4...'],
    external_id: ['c5h7i9j3k4l5...'],
    client_ip_address: '189.42.xxx.xxx',
    client_user_agent: 'Mozilla/5.0 (Linux; Android 14) ...',
    fbp: 'fb.1.1711612800.1234567890',
    fbc: 'fb.1.1711612800.AbCdEfGhIj',
    fn: 'd6i8j0k4l5m6...',
    ln: 'e7j9k1l5m6n7...',
    ct: 'f8k0l2m6n7o8...',
    st: 'g9l1m3n7o8p9...',
    country: 'h0m2n4o8p9q0...',
  },
  custom_data: {
    value: 37.00,
    currency: 'BRL',
    content_name: 'Protocolo Detox 21 Dias',
    content_category: 'Saúde',
    content_ids: ['prod_detox_21d'],
    predicted_ltv: 63.24,
    customer_type: 'new',
    funnel_stage: 'bottom',
    engagement_score: 7.8,
    buyer_prediction_score: 85,
    margin_tier: 'high',
    funnel_velocity: 'fast',
    bump_accepted: true,
    time_on_page: 245,
    scroll_depth: 92,
    video_watched: 78,
    session_count: 3,
  },
};

// ── Mock CAPI State ──

export const mockCAPIState: CAPIState = {
  funnel: mockFunnelConfig,
  syntheticRules: DEFAULT_SYNTHETIC_RULES,
  valueRules: mockValueRules,
  eventLogs: mockEventLogs,
  emqAnalysis: mockEMQAnalysis,
  isTestMode: false,
  connectionStatus: 'connected',
  stats: {
    events_24h: 1247,
    synthetic_24h: 342,
    match_rate: 89,
    avg_emq: 8.7,
  },
};
