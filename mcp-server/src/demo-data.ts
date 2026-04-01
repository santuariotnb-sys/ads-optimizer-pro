/**
 * demo-data.ts — Dados mock realistas para o MCP server Apex.
 * Espelha os tipos do React app (src/types/meta.ts) sem importar diretamente.
 */

export interface DemoCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'LEARNING' | 'LEARNING_LIMITED';
  objective: string;
  daily_budget: number;
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
  learning_days?: number;
  learning_conversions?: number;
}

export interface DemoCreative {
  id: string;
  name: string;
  entity_id_group: string;
  hook_rate: number;
  hold_rate: number;
  ctr: number;
  cpa: number;
  cpm: number;
  score: number;
  status: 'winner' | 'testing' | 'loser';
  novelty_days: number;
  impressions: number;
  spend: number;
  cpm_trend: number[];
}

export interface DemoMetrics {
  cpa: number;
  roas: number;
  ctr: number;
  cpm: number;
  spend: number;
  conversions: number;
  accountScore: number;
}

export interface DemoEMQ {
  score: number;
  breakdown: {
    email: number;
    phone: number;
    external_id: number;
    ip_ua: number;
    fbp: number;
    fbc: number;
  };
  level: number;
  maxScore: number;
}

// ─── Campanhas ───────────────────────────────────────────────────────────────

export const campaigns: DemoCampaign[] = [
  {
    id: 'camp_001',
    name: '[ASC] Protocolo Detox',
    status: 'ACTIVE',
    objective: 'OUTCOME_SALES',
    daily_budget: 500,
    roas: 3.82,
    cpa: 42.5,
    ctr: 2.8,
    cpm: 32.4,
    spend: 12450,
    conversions: 293,
    impressions: 384_259,
    clicks: 10_759,
    frequency: 1.8,
    opportunity_score: 87,
    created_time: '2026-02-15T10:00:00Z',
  },
  {
    id: 'camp_002',
    name: '[ASC] Skincare Premium',
    status: 'ACTIVE',
    objective: 'OUTCOME_SALES',
    daily_budget: 350,
    roas: 2.91,
    cpa: 58.3,
    ctr: 2.1,
    cpm: 28.6,
    spend: 8740,
    conversions: 150,
    impressions: 305_594,
    clicks: 6_417,
    frequency: 2.1,
    opportunity_score: 72,
    created_time: '2026-01-20T10:00:00Z',
  },
  {
    id: 'camp_003',
    name: '[CBO] Colageno Premium',
    status: 'ACTIVE',
    objective: 'OUTCOME_SALES',
    daily_budget: 200,
    roas: 0.82,
    cpa: 124.0,
    ctr: 0.9,
    cpm: 45.2,
    spend: 4960,
    conversions: 40,
    impressions: 109_735,
    clicks: 988,
    frequency: 3.4,
    opportunity_score: 28,
    created_time: '2026-01-05T10:00:00Z',
  },
  {
    id: 'camp_004',
    name: '[RETARGET] Carrinho Abandonado',
    status: 'ACTIVE',
    objective: 'OUTCOME_SALES',
    daily_budget: 150,
    roas: 5.21,
    cpa: 28.9,
    ctr: 4.2,
    cpm: 52.1,
    spend: 3180,
    conversions: 110,
    impressions: 61_036,
    clicks: 2_563,
    frequency: 3.2,
    opportunity_score: 91,
    created_time: '2026-02-01T10:00:00Z',
  },
  {
    id: 'camp_005',
    name: '[ASC] Black Friday',
    status: 'LEARNING_LIMITED',
    objective: 'OUTCOME_SALES',
    daily_budget: 800,
    roas: 1.45,
    cpa: 89.0,
    ctr: 1.5,
    cpm: 38.9,
    spend: 6230,
    conversions: 35,
    impressions: 160_154,
    clicks: 2_402,
    frequency: 1.4,
    opportunity_score: 45,
    created_time: '2026-03-14T10:00:00Z',
    learning_days: 18,
    learning_conversions: 35,
  },
  {
    id: 'camp_006',
    name: '[CBO] Whey Isolado',
    status: 'LEARNING',
    objective: 'OUTCOME_SALES',
    daily_budget: 300,
    roas: 1.85,
    cpa: 67.2,
    ctr: 1.9,
    cpm: 31.5,
    spend: 2410,
    conversions: 22,
    impressions: 76_508,
    clicks: 1_454,
    frequency: 1.2,
    opportunity_score: 58,
    created_time: '2026-03-24T10:00:00Z',
    learning_days: 8,
    learning_conversions: 22,
  },
];

// ─── Criativos ───────────────────────────────────────────────────────────────

export const creatives: DemoCreative[] = [
  // Entity ID Group A — UGC
  {
    id: 'cr_001', name: 'Reels — Trend Sound Detox', entity_id_group: 'A',
    hook_rate: 48, hold_rate: 65, ctr: 3.2, cpa: 32, cpm: 28.5,
    score: 96, status: 'winner', novelty_days: 5, impressions: 95_000, spend: 2710,
    cpm_trend: [27, 27.5, 28, 28.5, 28.5],
  },
  {
    id: 'cr_002', name: 'UGC — Influencer Detox', entity_id_group: 'A',
    hook_rate: 45, hold_rate: 62, ctr: 2.9, cpa: 38, cpm: 30.2,
    score: 95, status: 'winner', novelty_days: 7, impressions: 82_000, spend: 2476,
    cpm_trend: [29, 29.5, 30, 30.2, 30.2],
  },
  {
    id: 'cr_003', name: 'UGC — Resultados 30 dias', entity_id_group: 'A',
    hook_rate: 43, hold_rate: 58, ctr: 2.7, cpa: 41, cpm: 29.8,
    score: 93, status: 'winner', novelty_days: 2, impressions: 28_000, spend: 834,
    cpm_trend: [29.8],
  },

  // Entity ID Group B — Statics (OVERCROWDED)
  {
    id: 'cr_004', name: 'Static — Antes/Depois Detox', entity_id_group: 'B',
    hook_rate: 22, hold_rate: 35, ctr: 1.4, cpa: 72, cpm: 35.2,
    score: 42, status: 'testing', novelty_days: 12, impressions: 45_000, spend: 1584,
    cpm_trend: [28, 29, 31, 33, 35.2],
  },
  {
    id: 'cr_005', name: 'Static — Beneficios Grid', entity_id_group: 'B',
    hook_rate: 20, hold_rate: 30, ctr: 1.2, cpa: 85, cpm: 36.1,
    score: 35, status: 'loser', novelty_days: 14, impressions: 38_000, spend: 1372,
    cpm_trend: [30, 32, 34, 35, 36.1],
  },
  {
    id: 'cr_006', name: 'Static — Produto Lifestyle', entity_id_group: 'B',
    hook_rate: 18, hold_rate: 28, ctr: 1.1, cpa: 92, cpm: 37.5,
    score: 30, status: 'loser', novelty_days: 15, impressions: 32_000, spend: 1200,
    cpm_trend: [31, 33, 35, 36, 37.5],
  },
  {
    id: 'cr_007', name: 'Static — Ingredientes', entity_id_group: 'B',
    hook_rate: 19, hold_rate: 32, ctr: 1.3, cpa: 88, cpm: 34.8,
    score: 33, status: 'loser', novelty_days: 10, impressions: 35_000, spend: 1218,
    cpm_trend: [30, 31, 33, 34, 34.8],
  },
  {
    id: 'cr_008', name: 'Static — Comparativo Preco', entity_id_group: 'B',
    hook_rate: 15, hold_rate: 25, ctr: 0.7, cpa: 120, cpm: 42.3,
    score: 18, status: 'loser', novelty_days: 13, impressions: 22_000, spend: 930,
    cpm_trend: [35, 37, 39, 41, 42.3],
  },

  // Entity ID Group C — VSL
  {
    id: 'cr_009', name: 'VSL Detox — Hook Curiosidade', entity_id_group: 'C',
    hook_rate: 42, hold_rate: 55, ctr: 2.5, cpa: 45, cpm: 33.1,
    score: 88, status: 'winner', novelty_days: 6, impressions: 68_000, spend: 2251,
    cpm_trend: [32, 32.5, 33, 33, 33.1],
  },

  // Entity ID Group D — Carousel
  {
    id: 'cr_010', name: 'Carrossel — 5 Produtos Top', entity_id_group: 'D',
    hook_rate: 16, hold_rate: 22, ctr: 0.8, cpa: 120, cpm: 44.5,
    score: 22, status: 'loser', novelty_days: 11, impressions: 18_000, spend: 801,
    cpm_trend: [38, 40, 42, 43, 44.5],
  },

  // Entity ID Group E — Motion
  {
    id: 'cr_011', name: 'Motion 3D — Produto Hero', entity_id_group: 'E',
    hook_rate: 38, hold_rate: 50, ctr: 2.3, cpa: 48, cpm: 30.8,
    score: 82, status: 'winner', novelty_days: 4, impressions: 42_000, spend: 1294,
    cpm_trend: [30.5, 30.8],
  },
];

// ─── Metricas da conta ───────────────────────────────────────────────────────

export const metrics: DemoMetrics = {
  cpa: 52.4,
  roas: 3.24,
  ctr: 2.15,
  cpm: 33.8,
  spend: 37_970,
  conversions: 650,
  accountScore: 74,
};

// ─── EMQ ─────────────────────────────────────────────────────────────────────

export const emq: DemoEMQ = {
  score: 6.8,
  breakdown: {
    email: 2.0,
    phone: 1.5,
    external_id: 1.5,
    ip_ua: 1.0,
    fbp: 0.5,
    fbc: 0.3,
  },
  level: 2,
  maxScore: 7.0,
};

// ─── Thresholds (espelha constants.ts) ───────────────────────────────────────

export const THRESHOLDS = {
  CPA_INCREASE_PCT: 25,
  CPM_INCREASE_PCT: 30,
  CTR_MIN: 1,
  FREQUENCY_MAX: 3,
  ROAS_MIN: 1,
  EMQ_MIN: 8,
  LEARNING_MAX_DAYS: 14,
  NOVELTY_MAX_DAYS: 7,
  ENTITY_OVERCROWDED: 3,
  AUTO_SCALE_MAX_PCT: 10,
  AUTO_SCALE_COOLDOWN_H: 48,
  MIN_DAYS_DECISION: 7,
};
