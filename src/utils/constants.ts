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
  bg: '#0a0a0a',
  bgBase: '#111110',
  surface: '#1a1918',
  surface2: '#232220',
  surface3: '#2d2b28',
  surfaceHover: '#353330',
  border: 'rgba(255, 200, 120, 0.06)',
  borderHover: 'rgba(255, 200, 120, 0.14)',
  borderActive: 'rgba(245, 158, 11, 0.3)',
  text: '#fafaf9',
  textSecondary: '#d6d3d1',
  textMuted: '#a8a29e',
  textDim: '#78716c',
  accent: '#f59e0b',
  accentHover: '#fbbf24',
  accentDeep: '#d97706',
  success: '#84cc16',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  orange: '#fb923c',
  accentLight: '#fbbf24',
  purple: '#d97706',
  pink: '#fb923c',
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
