// ── CAPI Level 5 — Signal Engineering Types ──

export type FunnelType = 'infoproduto' | 'dropshipping' | 'saas' | 'leadgen' | 'custom';
export type ActionSource = 'website' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'other';
export type CustomerType = 'new' | 'returning' | 'vip' | 'at_risk';
export type FunnelStage = 'top' | 'middle' | 'bottom' | 'post_purchase';
export type FunnelVelocity = 'fast' | 'normal' | 'slow';
export type MarginTier = 'low' | 'medium' | 'high';
export type CartValueTier = 'low' | 'medium' | 'high';
export type PlanTier = 'basic' | 'pro' | 'enterprise';
export type CompanySize = 'small' | 'medium' | 'enterprise';
export type DecisionStage = 'awareness' | 'consideration' | 'decision';

// ── Funnel Configuration ──

export interface FunnelEvent {
  id: string;
  event_name: string;
  display_name: string;
  is_synthetic: boolean;
  enabled: boolean;
  description: string;
  default_value?: number;
}

export interface FunnelValues {
  front_end: number;
  bump1_value: number;
  bump1_rate: number;
  bump2_value: number;
  bump2_rate: number;
  upsell_value: number;
  upsell_rate: number;
  downsell_value: number;
  downsell_rate: number;
}

export interface FunnelConfig {
  id: string;
  name: string;
  type: FunnelType;
  pixel_id: string;
  access_token: string;
  events: FunnelEvent[];
  values: FunnelValues;
  predicted_ltv: number;
  epv: number;
  created_at: string;
  updated_at: string;
}

// ── Auto-collected Client-side Data ──

export interface AutoCollectedData {
  scroll_depth: number;
  time_on_page: number;
  pages_viewed_session: number;
  session_count: number;
  video_watched_pct: number;
  video_watch_time: number;
  clicks_on_page: number;
  device_type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  screen_resolution: string;
  connection_type: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  referrer_url: string;
  landing_page: string;
  fbp: string;
  fbc: string;
  fbclid: string;
}

// ── Server-side Calculated Data ──

export interface CalculatedData {
  engagement_score: number;
  predicted_ltv: number;
  customer_type: CustomerType;
  margin_tier: MarginTier;
  funnel_velocity: FunnelVelocity;
  buyer_prediction_score: number;
  funnel_stage: FunnelStage;
}

// ── Synthetic Event Rules ──

export type ConditionOperator = '>=' | '<=' | '>' | '<' | '==' | '!=';

export interface SyntheticCondition {
  field: string;
  operator: ConditionOperator;
  value: number | boolean | string;
}

export interface SyntheticEventRule {
  id: string;
  event_name: string;
  description: string;
  conditions: SyntheticCondition[];
  value_multiplier?: number;
  cooldown_hours: number;
  enabled: boolean;
  fires_24h: number;
  fire_rate: number;
}

// ── CAPI Payload (Level 5) ──

export interface CAPIUserData {
  em?: string[];
  ph?: string[];
  external_id?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
  fn?: string;
  ln?: string;
  ge?: string;
  db?: string;
  ct?: string;
  st?: string;
  zp?: string;
  country?: string;
}

export interface CAPICustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  contents?: Array<{ id: string; quantity: number; item_price: number }>;
  num_items?: number;
  predicted_ltv?: number;
  order_id?: string;
  search_string?: string;
  status?: string;
  delivery_category?: string;
  customer_type?: string;
  funnel_stage?: string;
  engagement_score?: number;
  buyer_prediction_score?: number;
  margin_tier?: string;
  funnel_velocity?: string;
  bump_accepted?: boolean;
  upsell_value?: number;
  time_on_page?: number;
  scroll_depth?: number;
  video_watched?: number;
  session_count?: number;
  content_consumed?: number;
  days_as_customer?: number;
  cart_value_tier?: string;
  discount_applied?: boolean;
  coupon_code?: string;
  lead_score?: number;
  plan_tier?: string;
}

export interface CAPIEventPayload {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: ActionSource;
  opt_out: boolean;
  user_data: CAPIUserData;
  custom_data: CAPICustomData;
}

// ── Value Rules ──

export interface ValueRule {
  id: string;
  name: string;
  conditions: {
    customer_type?: CustomerType;
    geo_locations?: string[];
    age_range?: { min: number; max: number };
    gender?: 'male' | 'female';
  };
  bid_multiplier: number;
  enabled: boolean;
}

// ── EMQ Extended ──

export interface EMQParameter {
  key: string;
  label: string;
  present: boolean;
  estimated_impact: number;
  max_impact: number;
}

export interface EMQAnalysis {
  overall_score: number;
  parameters: EMQParameter[];
  level: 'critical' | 'warning' | 'good' | 'excellent';
  recommendation: string;
}

// ── Event Log ──

export interface CAPIEventLog {
  id: string;
  event_name: string;
  event_id: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'retrying';
  response_code?: number;
  user_data_fields: string[];
  custom_data_fields: string[];
  is_synthetic: boolean;
  value?: number;
  emq_contribution: number;
}

// ── CAPI Module State ──

export interface CAPIState {
  funnel: FunnelConfig | null;
  syntheticRules: SyntheticEventRule[];
  valueRules: ValueRule[];
  eventLogs: CAPIEventLog[];
  emqAnalysis: EMQAnalysis | null;
  isTestMode: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'testing';
  stats: {
    events_24h: number;
    synthetic_24h: number;
    match_rate: number;
    avg_emq: number;
  };
}
