export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'LEARNING' | 'LEARNING_LIMITED' | 'DELETED';
export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';
export type CreativeStatus = 'winner' | 'testing' | 'loser';
export type AppMode = 'demo' | 'live';
export type Period = 'today' | '7d' | '14d' | '30d';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  objective: string;
  daily_budget: number;
  lifetime_budget: number;
  roas: number;
  cpa: number;
  ctr: number;
  cpm: number;
  spend: number;
  conversions: number;
  impressions: number;
  clicks: number;
  frequency: number;
  opportunity_score: number;
  created_time: string;
  budget_suggestion?: number;
  learning_days?: number;
  learning_conversions?: number;
}

export interface AdSet {
  id: string;
  campaign_id: string;
  name: string;
  status: CampaignStatus;
  optimization_goal: string;
  daily_budget: number;
  targeting: {
    geo_locations?: { countries: string[] };
    age_min?: number;
    age_max?: number;
    genders?: number[];
    custom_audiences?: { id: string; name: string }[];
  };
  roas: number;
  cpa: number;
  ctr: number;
  cpm: number;
  spend: number;
  conversions: number;
  impressions: number;
  clicks: number;
}

export interface Ad {
  id: string;
  adset_id: string;
  name: string;
  status: CampaignStatus;
  creative: Creative;
  roas: number;
  cpa: number;
  ctr: number;
  cpm: number;
  spend: number;
  conversions: number;
  impressions: number;
  clicks: number;
}

export interface Creative {
  id: string;
  name: string;
  thumbnail_url: string;
  image_hash: string;
  entity_id_group: number;
  hook_rate: number;
  hold_rate: number;
  thumbstop_ratio: number;
  ctr: number;
  cpc: number;
  cpa: number;
  cpm: number;
  score: number;
  status: CreativeStatus;
  novelty_days: number;
  cpm_trend: number[];
  impressions: number;
  spend: number;
}

export interface MetricCard {
  label: string;
  value: string;
  change: number;
  sparkline: number[];
  prefix?: string;
  suffix?: string;
  icon?: string;
}

export interface EMQBreakdown {
  email: number;
  phone: number;
  external_id: number;
  ip_ua: number;
  fbp: number;
  fbc: number;
  total: number;
}

export interface CAPIEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: string;
  user_data: {
    em?: string[];
    ph?: string[];
    external_id?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
    fbp?: string;
    fbc?: string;
  };
  custom_data: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    predicted_ltv?: number;
    num_items?: number;
    customer_type?: string;
    funnel_stage?: string;
    bump_accepted?: boolean;
    upsell_value?: number;
    margin_tier?: string;
    engagement_score?: number;
    time_on_page?: number;
    scroll_depth?: number;
    video_watched?: number;
  };
}

export type SyntheticEventType =
  | 'DeepEngagement'
  | 'HighIntentVisitor'
  | 'QualifiedLead'
  | 'PredictedBuyer'
  | 'UpsellCandidate'
  | 'AppActivation'
  | 'ProtocolCompleted';

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  metric_name?: string;
  threshold?: number;
  current_value?: number;
  campaign_id?: string;
  dismissed: boolean;
}

export interface Audience {
  id: string;
  name: string;
  size: number;
  cpa: number;
  roas: number;
  overlap_percent: number;
  saturation_percent: number;
  frequency: number;
  status: 'active' | 'saturated' | 'warning';
}

export interface AutoScaleRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  last_triggered?: string;
  cooldown_hours: number;
}

export interface PlaybookEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  source: string;
  impact: string;
}

export interface EntityIDGroup {
  entity_id: number;
  creatives: Creative[];
  total_spend: number;
  avg_cpa: number;
  is_overcrowded: boolean;
}

export interface DashboardMetrics {
  cpa: number;
  roas: number;
  ctr: number;
  cpm: number;
  mer: number;
  spend: number;
  conversions: number;
  accountScore: number;
}

export interface PipelineStage {
  name: string;
  description: string;
  details: string[];
  metrics?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
