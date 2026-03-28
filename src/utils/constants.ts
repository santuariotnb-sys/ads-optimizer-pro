export const META_APP_ID = import.meta.env.VITE_META_APP_ID || '';
export const META_REDIRECT_URI = import.meta.env.VITE_META_REDIRECT_URI || 'http://localhost:5173/auth/callback';
export const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

export const API_VERSION = 'v21.0';
export const GRAPH_API_BASE = 'https://graph.facebook.com';
export const RATE_LIMIT_PER_HOUR = 200;
export const CACHE_TTL_MS = 5 * 60 * 1000;
export const ENTITY_SIMILARITY_THRESHOLD = 0.6;
export const MAX_CREATIVES_PER_ENTITY = 3;
export const POLLING_INTERVAL_MS = 5 * 60 * 1000;

export const ALERT_THRESHOLDS = {
  CPA_INCREASE_PCT: 25,
  CPM_INCREASE_PCT: 30,
  CTR_MIN: 1,
  FREQUENCY_MAX: 3,
  ROAS_MIN: 1,
  EMQ_MIN: 8,
  LEARNING_MAX_DAYS: 14,
  NOVELTY_MAX_DAYS: 7,
  OPPORTUNITY_SCORE_MIN: 70,
} as const;

export const AUTO_SCALE = {
  MAX_BUDGET_CHANGE_PCT: 20,
  MIN_INTERVAL_HOURS: 48,
  MIN_DAYS_BEFORE_DECISION: 7,
  TARGET_CONVERSIONS_PER_WEEK: 50,
} as const;

export const EMQ_WEIGHTS = {
  email: 2,
  phone: 1.5,
  external_id: 1.5,
  ip_ua: 1,
  fbp: 0.5,
  fbc: 0.5,
} as const;

export const SIGNAL_LEVELS = [
  { level: 1, name: 'Pixel Básico', pct: '90%', desc: 'Foto borrada — apenas pixel padrão' },
  { level: 2, name: 'CAPI Básico', pct: '8%', desc: 'CAPI com deduplicação — funcional' },
  { level: 3, name: 'CAPI Enriquecido', pct: '1.5%', desc: 'EMQ 8.5+ — dados ricos de match' },
  { level: 4, name: 'Metadata de Valor', pct: '0.3%', desc: 'predicted_ltv, margin_tier, engagement_score' },
  { level: 5, name: 'Synthetic Events', pct: '0.01%', desc: 'Eventos sintéticos + preditivos — nível alien' },
] as const;

export const SYNTHETIC_EVENTS = [
  { type: 'DeepEngagement', trigger: 'Scroll 75% + 2min+ na LP', description: 'Usuário profundamente engajado' },
  { type: 'HighIntentVisitor', trigger: 'Visitou LP 3x em 48h', description: 'Alta intenção de compra' },
  { type: 'QualifiedLead', trigger: 'Email + VSL 50%+', description: 'Lead qualificado' },
  { type: 'PredictedBuyer', trigger: 'IA: 80%+ chance', description: 'Compra prevista pela IA' },
  { type: 'UpsellCandidate', trigger: 'Comprou front + bump', description: 'Candidato a upsell' },
  { type: 'AppActivation', trigger: 'Abriu app 1ª vez', description: 'Ativação pós-venda' },
  { type: 'ProtocolCompleted', trigger: 'Protocolo completo', description: 'Retroalimenta Andromeda' },
] as const;

export const COLORS = {
  bg: '#000000',
  bgBase: '#0a0a0a',
  surface: '#0a0a0a',
  surface2: '#111111',
  surface3: '#1a1a1a',
  surfaceHover: '#222222',
  border: 'rgba(255, 255, 255, 0.05)',
  borderHover: 'rgba(255, 255, 255, 0.1)',
  borderActive: 'rgba(16, 185, 129, 0.3)',
  text: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  textDim: '#525252',
  accent: '#10b981',
  accentHover: '#34d399',
  accentDeep: '#059669',
  accentGlow: 'rgba(16, 185, 129, 0.12)',
  secondary: '#06b6d4',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#eab308',
  info: '#06b6d4',
  orange: '#f97316',
  accentLight: '#34d399',
  purple: '#06b6d4',
  pink: '#f97316',
} as const;

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'campaigns', label: 'Campanhas', icon: 'Megaphone' },
  { id: 'creatives', label: 'Criativos', icon: 'Image' },
  { id: 'signal', label: 'Signal Engine', icon: 'Radio' },
  { id: 'audiences', label: 'Públicos', icon: 'Users' },
  { id: 'alerts', label: 'Alertas', icon: 'Bell' },
  { id: 'agent', label: 'Agente IA', icon: 'Bot' },
  { id: 'pipeline', label: 'Pipeline', icon: 'GitBranch' },
  { id: 'create', label: 'Criar Campanha', icon: 'PlusCircle' },
  { id: 'autoscale', label: 'Auto-Scale', icon: 'Zap' },
  { id: 'playbook', label: 'Playbook', icon: 'BookOpen' },
] as const;
