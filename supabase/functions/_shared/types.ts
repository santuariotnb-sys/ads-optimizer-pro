export interface BrowserEvent {
  event_name: string;
  event_source_url: string;
  timestamp: number;
  event_id: string;
  pixel_fired: boolean;
  funnel_id?: string;

  visitor: {
    fbp: string | null;
    fbc: string | null;
    session_id: string;
    ip: string | null;
    user_agent: string;
  };

  behavior: {
    scroll_depth: number;
    time_on_page: number;
    video_watched_pct: number;
    pages_viewed: number;
    referrer: string;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_content: string | null;
    device_type: string;
    landing_page: string;
  };

  conversion: {
    value: number | null;
    currency: string;
    content_name: string | null;
    content_ids: string[] | null;
    num_items: number | null;
    order_id: string | null;
  } | null;

  identity: {
    email: string | null;
    phone: string | null;
    first_name: string | null;
    last_name: string | null;
    external_id: string | null;
  } | null;
}

export interface EnrichedIdentity {
  email_hash: string | null;
  phone_hash: string | null;
  external_id_hash: string | null;
  fn_hash: string | null;
  ln_hash: string | null;
  fbp: string | null;
  fbc: string | null;
  ip: string;
  ua: string;
  customer_type: string;
  purchase_count: number;
  total_spent: number;
  predicted_ltv: number;
  first_seen: string | null;
  emq_estimate: number;
}

export interface CAPIPayload {
  data: CAPIEvent[];
  access_token: string;
}

export interface CAPIEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: string;
  opt_out: boolean;
  user_data: Record<string, unknown>;
  custom_data: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  reason: string | null;
}

export interface DeliveryResult {
  status: number;
  body: unknown;
  attempts: number;
}
