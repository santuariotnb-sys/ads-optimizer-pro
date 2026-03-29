import type { Campaign, AdSet, Ad, Creative, Audience, Alert, MetricCard, EMQBreakdown, AutoScaleRule, PlaybookEntry, EntityIDGroup, CAPIEvent, SignalAuditResult } from '../types/meta';

// 6 campaigns with realistic Brazilian names
export const mockCampaigns: Campaign[] = [
  {
    id: 'camp_001', name: '[ASC] Protocolo Detox — Broad', status: 'ACTIVE',
    objective: 'OUTCOME_SALES', daily_budget: 500, lifetime_budget: 0,
    roas: 3.82, cpa: 42.50, ctr: 2.1, cpm: 38.90, spend: 12450,
    conversions: 293, impressions: 320000, clicks: 6720, frequency: 1.8,
    opportunity_score: 87, created_time: '2026-03-01T10:00:00Z',
    budget_suggestion: 550, learning_days: 0, learning_conversions: 50
  },
  {
    id: 'camp_002', name: '[CBO] Kit Skincare — Lookalike 1%', status: 'ACTIVE',
    objective: 'OUTCOME_SALES', daily_budget: 350, lifetime_budget: 0,
    roas: 2.94, cpa: 58.30, ctr: 1.7, cpm: 42.10, spend: 8750,
    conversions: 150, impressions: 207800, clicks: 3533, frequency: 2.1,
    opportunity_score: 72, created_time: '2026-03-05T14:00:00Z',
    budget_suggestion: 420, learning_days: 0, learning_conversions: 50
  },
  {
    id: 'camp_003', name: '[ASC] Suplemento Whey — Performance', status: 'LEARNING',
    objective: 'OUTCOME_SALES', daily_budget: 200, lifetime_budget: 0,
    roas: 1.45, cpa: 89.00, ctr: 1.2, cpm: 52.30, spend: 3200,
    conversions: 36, impressions: 61200, clicks: 734, frequency: 1.3,
    opportunity_score: 45, created_time: '2026-03-20T08:00:00Z',
    budget_suggestion: 200, learning_days: 8, learning_conversions: 22
  },
  {
    id: 'camp_004', name: '[RETARGET] Carrinho Abandonado 7d', status: 'ACTIVE',
    objective: 'OUTCOME_SALES', daily_budget: 150, lifetime_budget: 0,
    roas: 5.21, cpa: 28.40, ctr: 3.8, cpm: 65.20, spend: 4200,
    conversions: 148, impressions: 64400, clicks: 2447, frequency: 3.2,
    opportunity_score: 91, created_time: '2026-02-15T12:00:00Z',
    budget_suggestion: 180, learning_days: 0, learning_conversions: 50
  },
  {
    id: 'camp_005', name: '[CBO] Colágeno Premium — Interesses', status: 'PAUSED',
    objective: 'OUTCOME_SALES', daily_budget: 250, lifetime_budget: 0,
    roas: 0.82, cpa: 145.00, ctr: 0.8, cpm: 48.60, spend: 5800,
    conversions: 40, impressions: 119300, clicks: 954, frequency: 2.8,
    opportunity_score: 28, created_time: '2026-02-20T09:00:00Z',
    budget_suggestion: 0, learning_days: 0, learning_conversions: 50
  },
  {
    id: 'camp_006', name: '[ASC] Black Friday — Multi-Produto', status: 'LEARNING_LIMITED',
    objective: 'OUTCOME_SALES', daily_budget: 800, lifetime_budget: 0,
    roas: 1.92, cpa: 72.00, ctr: 1.5, cpm: 44.80, spend: 15200,
    conversions: 211, impressions: 339300, clicks: 5090, frequency: 2.4,
    opportunity_score: 55, created_time: '2026-03-10T16:00:00Z',
    budget_suggestion: 800, learning_days: 18, learning_conversions: 35
  }
];

// 8 audiences
export const mockAudiences: Audience[] = [
  { id: 'aud_001', name: 'Lookalike 1% — Compradores 180d', size: 2100000, cpa: 45.20, roas: 3.50, overlap_percent: 12, saturation_percent: 35, frequency: 1.9, status: 'active' },
  { id: 'aud_002', name: 'Lookalike 3% — Compradores 180d', size: 6300000, cpa: 62.80, roas: 2.40, overlap_percent: 45, saturation_percent: 22, frequency: 1.4, status: 'active' },
  { id: 'aud_003', name: 'Retarget — Visitantes 7d', size: 85000, cpa: 28.40, roas: 5.21, overlap_percent: 8, saturation_percent: 78, frequency: 3.2, status: 'warning' },
  { id: 'aud_004', name: 'Retarget — Add to Cart 14d', size: 42000, cpa: 32.10, roas: 4.80, overlap_percent: 62, saturation_percent: 65, frequency: 2.8, status: 'warning' },
  { id: 'aud_005', name: 'Interesse — Fitness & Suplementos', size: 15000000, cpa: 89.00, roas: 1.45, overlap_percent: 28, saturation_percent: 12, frequency: 1.3, status: 'active' },
  { id: 'aud_006', name: 'Interesse — Skincare & Beleza', size: 12000000, cpa: 58.30, roas: 2.94, overlap_percent: 35, saturation_percent: 18, frequency: 1.6, status: 'active' },
  { id: 'aud_007', name: 'Custom — Engajamento IG 90d', size: 320000, cpa: 52.00, roas: 3.10, overlap_percent: 22, saturation_percent: 42, frequency: 2.1, status: 'active' },
  { id: 'aud_008', name: 'Broad — Sem segmentação', size: 85000000, cpa: 55.00, roas: 2.80, overlap_percent: 0, saturation_percent: 5, frequency: 1.1, status: 'active' }
];

// 15 alerts
export const mockAlerts: Alert[] = [
  { id: 'alert_001', type: 'cpa_increase', severity: 'critical', title: 'CPA disparou +32%', message: 'Campanha [CBO] Colágeno Premium — CPA subiu de R$110 para R$145 em 24h. Considere pausar.', timestamp: '2026-03-28T08:30:00Z', metric_name: 'CPA', threshold: 25, current_value: 32, campaign_id: 'camp_005', dismissed: false },
  { id: 'alert_002', type: 'winner', severity: 'success', title: 'Winner identificado!', message: 'Criativo "VSL Detox 60s — Hook Curiosidade" mantém CPA R$38 por 72h. Escalar +10%.', timestamp: '2026-03-28T07:00:00Z', campaign_id: 'camp_001', dismissed: false },
  { id: 'alert_003', type: 'fatigue', severity: 'warning', title: 'Fadiga criativa detectada', message: 'Criativo "Static — Antes/Depois" — CPM subiu 38% em 72h. Novo Entity ID necessário.', timestamp: '2026-03-28T06:15:00Z', campaign_id: 'camp_002', dismissed: false },
  { id: 'alert_004', type: 'frequency', severity: 'warning', title: 'Frequência alta', message: 'Campanha [RETARGET] Carrinho Abandonado — Frequência 3.2. Expandir público ou pausar.', timestamp: '2026-03-27T22:00:00Z', campaign_id: 'camp_004', dismissed: false },
  { id: 'alert_005', type: 'emq', severity: 'critical', title: 'EMQ abaixo do mínimo', message: 'EMQ caiu para 6.8. Verificar integração CAPI — email e phone não estão sendo enviados.', timestamp: '2026-03-27T18:00:00Z', dismissed: false },
  { id: 'alert_006', type: 'roas_low', severity: 'critical', title: 'ROAS negativo', message: 'Campanha [CBO] Colágeno Premium — ROAS 0.82. Campanha operando no prejuízo.', timestamp: '2026-03-27T16:00:00Z', campaign_id: 'camp_005', dismissed: true },
  { id: 'alert_007', type: 'learning', severity: 'info', title: 'Learning phase prolongada', message: 'Campanha [ASC] Black Friday está há 18 dias em learning. Apenas 35/50 conversões. Consolidar ad sets.', timestamp: '2026-03-27T14:00:00Z', campaign_id: 'camp_006', dismissed: false },
  { id: 'alert_008', type: 'ctr_low', severity: 'warning', title: 'CTR abaixo de 1%', message: 'Criativo "Carrossel Produtos" — CTR 0.8% após 9 dias. Pausar criativo.', timestamp: '2026-03-27T12:00:00Z', dismissed: false },
  { id: 'alert_009', type: 'scale', severity: 'success', title: 'Escalar campanha', message: 'Campanha [ASC] Protocolo Detox mantém CPA R$42.50 abaixo do alvo (R$55) por 72h. Escalar +10%.', timestamp: '2026-03-27T10:00:00Z', campaign_id: 'camp_001', dismissed: false },
  { id: 'alert_010', type: 'overlap', severity: 'info', title: 'Overlap alto detectado', message: 'Públicos "Lookalike 3%" e "Add to Cart 14d" têm 62% de overlap. Consolidar para evitar competição.', timestamp: '2026-03-27T08:00:00Z', dismissed: false },
  { id: 'alert_011', type: 'budget', severity: 'info', title: 'Sugestão de budget', message: 'Kit Skincare atingiu CPA alvo consistente. Sugestão: aumentar budget diário de R$350 para R$420.', timestamp: '2026-03-26T20:00:00Z', campaign_id: 'camp_002', dismissed: false },
  { id: 'alert_012', type: 'novelty', severity: 'warning', title: 'Novelty bias expirando', message: '4 criativos com mais de 10 dias ativos. Prepare novos criativos para manter performance.', timestamp: '2026-03-26T16:00:00Z', dismissed: false },
  { id: 'alert_013', type: 'entity_id', severity: 'info', title: 'Entity ID superlotado', message: 'Entity Group #2 tem 5 criativos similares. Andromeda usa apenas 1 ticket no leilão. Diversificar.', timestamp: '2026-03-26T14:00:00Z', dismissed: false },
  { id: 'alert_014', type: 'capi', severity: 'success', title: 'CAPI otimizado', message: 'Signal Level subiu para Nível 4. predicted_ltv e margin_tier agora sendo enviados.', timestamp: '2026-03-26T10:00:00Z', dismissed: true },
  { id: 'alert_015', type: 'conversion', severity: 'success', title: 'Meta de conversões atingida', message: 'Conta atingiu 293 conversões esta semana. Meta de 250 superada em 17%.', timestamp: '2026-03-26T08:00:00Z', dismissed: false }
];

// Dashboard metric cards with sparkline data
export const mockMetricCards: MetricCard[] = [
  { label: 'CPA', value: 'R$ 52,40', change: -8.3, sparkline: [68, 62, 58, 55, 54, 53, 52.4], prefix: 'R$' },
  { label: 'ROAS', value: '3.24x', change: 12.5, sparkline: [2.5, 2.7, 2.9, 3.0, 3.1, 3.2, 3.24], suffix: 'x' },
  { label: 'CTR', value: '1.92%', change: 5.2, sparkline: [1.6, 1.7, 1.75, 1.8, 1.85, 1.9, 1.92], suffix: '%' },
  { label: 'CPM', value: 'R$ 44,80', change: -3.1, sparkline: [48, 47, 46.5, 46, 45.5, 45, 44.8], prefix: 'R$' },
  { label: 'MER', value: '2.87x', change: 9.8, sparkline: [2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 2.87], suffix: 'x' },
  { label: 'Investimento', value: 'R$ 49.600', change: 15.0, sparkline: [35000, 38000, 41000, 43000, 45000, 47000, 49600], prefix: 'R$' },
  { label: 'Conversões', value: '878', change: 22.4, sparkline: [520, 580, 640, 700, 760, 820, 878] },
  { label: 'Score da Conta', value: '74', change: 6.0, sparkline: [62, 64, 66, 68, 70, 72, 74] }
];

export const mockDashboardMetrics = {
  cpa: 52.40,
  roas: 3.24,
  ctr: 1.92,
  cpm: 44.80,
  mer: 2.87,
  spend: 49600,
  conversions: 878,
  accountScore: 74,
};

export const mockEMQ: EMQBreakdown = {
  email: 2.0,
  phone: 1.5,
  external_id: 1.5,
  ip_ua: 1.0,
  fbp: 0.5,
  fbc: 0.3,
  total: 6.8
};

// Auto scale rules
export const mockAutoScaleRules: AutoScaleRule[] = [
  { id: 'rule_001', name: 'Escalar Winners', condition: 'CPA < alvo por 48h', action: 'Budget +10%', enabled: true, last_triggered: '2026-03-27T10:00:00Z', cooldown_hours: 48 },
  { id: 'rule_002', name: 'Pausar Losers', condition: 'CTR < 1% + 7d + 0 conv', action: 'Pausar Ad', enabled: true, last_triggered: '2026-03-26T14:00:00Z', cooldown_hours: 24 },
  { id: 'rule_003', name: 'Pausar CPA Alto', condition: 'CPA > 2x alvo por 48h', action: 'Pausar Ad Set', enabled: true, cooldown_hours: 48 },
  { id: 'rule_004', name: 'Alerta Frequência', condition: 'Frequência > 3.0', action: 'Notificar', enabled: true, last_triggered: '2026-03-27T22:00:00Z', cooldown_hours: 24 },
  { id: 'rule_005', name: 'Alerta Fadiga', condition: 'CPM +30% em 72h', action: 'Notificar', enabled: true, last_triggered: '2026-03-28T06:15:00Z', cooldown_hours: 72 },
  { id: 'rule_006', name: 'Refresh Criativos', condition: 'Criativo > 10 dias', action: 'Notificar', enabled: false, cooldown_hours: 168 }
];

// Playbook entries
export const mockPlaybookEntries: PlaybookEntry[] = [
  { id: 'pb_001', title: 'Entity ID: Diversifique seus criativos', category: 'Criativos', content: 'O Andromeda agrupa criativos com >60% de similaridade visual sob o mesmo Entity ID. Cada Entity ID = 1 ticket no leilão. Ter 10 criativos mas 3 Entity IDs significa apenas 3 chances no leilão. Diversifique formatos: static, vídeo, carrossel, UGC, antes/depois.', source: 'Confect.io — 3.014 anunciantes, $834M ad spend', impact: 'Vero Moda: +60% vendas com diversificação de Entity IDs' },
  { id: 'pb_002', title: 'Novelty Bias: CPM dobra em 7 dias', category: 'Criativos', content: 'O Meta favorece criativos novos com CPM mais baixo (novelty bias). Após 7 dias, o CPM pode dobrar. Refresh criativos a cada 7-10 dias para manter custos baixos. Monitore a tendência de CPM por criativo.', source: 'Dark community data — testado em +100 contas', impact: 'CPM -40% ao manter pipeline de criativos frescos' },
  { id: 'pb_003', title: 'Signal Engineering Nível 4: O diferencial', category: 'CAPI', content: 'Envie predicted_ltv, margin_tier e engagement_score via CAPI. Isso ensina o Andromeda a encontrar compradores de alto valor, não apenas compradores. Apenas 0.3% dos anunciantes fazem isso.', source: 'CustomerLabs, Hightouch, Funnel.io, AdZeta', impact: 'CPA -11% (EMQ 5.2→8.4), caso extremo: CPA $150→$25' },
  { id: 'pb_004', title: 'CAPI: -13% CPA e +19% compras', category: 'CAPI', content: 'Implementar CAPI corretamente reduz CPA em 13% e aumenta compras atribuídas em 19%. EMQ ideal: 8.0+. Garanta deduplicação via event_id entre pixel e CAPI.', source: 'Meta Business Help Center — dados oficiais', impact: '-13% CPA, +19% compras atribuídas' },
  { id: 'pb_005', title: 'Advantage+ Sales: +22% ROAS', category: 'Campanhas', content: 'Campanhas Advantage+ Sales (ASC) usam machine learning completo do Meta para otimizar entrega. Não adicione interesses manuais — deixe o Andromeda fazer broad targeting. Use CBO com 6+ criativos por ad set.', source: 'Meta — dados oficiais Q4 2024', impact: '+22% ROAS vs campanhas manuais' },
  { id: 'pb_006', title: 'First Conversion vs All Conversions', category: 'Campanhas', content: 'Use "First Conversion" como attribution setting. "All Conversions" infla números e confunde o algoritmo. First Conversion dá uma visão mais precisa do ROAS real.', source: 'Meta Ads best practices — confirmado por top agencies', impact: 'Dados mais precisos, otimização mais eficiente' },
  { id: 'pb_007', title: 'GEM: +5% conversões IG, +3% FB', category: 'Algoritmo', content: 'O GEM (Generative Recommender Model) é o maior foundation model de recomendação do mundo (escala GPT-4). Ativo desde Q2 2025 sem opt-in. Aprende cross-platform (IG↔FB). Seus criativos competem com bilhões — qualidade importa mais que nunca.', source: 'Meta Engineering Blog — Q2 2025', impact: '+5% conversões IG, +3% FB Feed' },
  { id: 'pb_008', title: 'MTIA v2: 7× mais compute para IA', category: 'Algoritmo', content: 'O Meta treina e roda Andromeda + GEM em MTIA v2 (5nm, 256MB SRAM, 2.7TB/s bandwidth) + NVIDIA Grace Hopper Superchip. O retrieval de 1 bilhão de ads para ~1.000 candidatos acontece em <200ms.', source: 'Meta Engineering Blog, NVIDIA', impact: 'Leilões mais inteligentes e rápidos' },
  { id: 'pb_009', title: 'Synthetic Events: Nível 5 de Signal', category: 'CAPI', content: 'Crie eventos sintéticos (DeepEngagement, HighIntentVisitor, QualifiedLead) e envie via CAPI. Isso ensina o Andromeda comportamentos pré-compra que ele não consegue ver sozinho. Apenas 0.01% dos anunciantes fazem isso.', source: 'CustomerLabs/AdZeta — R$5.000+/mês como serviço', impact: 'Audiences de altíssima qualidade, CPA significativamente menor' },
  { id: 'pb_010', title: 'Value Rules: +46% ROAS', category: 'Campanhas', content: 'Use Value Rules para dizer ao Meta que first-time purchasers valem mais. Laura Geller obteve +46% ROAS usando custom event "first-time purchaser" com valor ajustado.', source: 'Laura Geller case study — Meta', impact: '+46% ROAS' }
];

// 24 creatives across 5 entity groups
export const mockCreativesData: Creative[] = [
  { id: 'cr_001', name: 'VSL Detox 60s — Hook Curiosidade', thumbnail_url: '', image_hash: 'a1b2c3d4', entity_id_group: 1, hook_rate: 42, hold_rate: 58, thumbstop_ratio: 35, ctr: 2.8, cpc: 1.20, cpa: 38.00, cpm: 33.60, score: 92, status: 'winner', novelty_days: 5, cpm_trend: [32, 33, 33.5, 33, 34, 33.6], impressions: 85000, spend: 2856 },
  { id: 'cr_002', name: 'VSL Detox 60s — Hook Dor', thumbnail_url: '', image_hash: 'a1b2c3d5', entity_id_group: 1, hook_rate: 38, hold_rate: 52, thumbstop_ratio: 30, ctr: 2.4, cpc: 1.45, cpa: 44.00, cpm: 34.80, score: 85, status: 'winner', novelty_days: 5, cpm_trend: [33, 34, 34.5, 34, 35, 34.8], impressions: 72000, spend: 2506 },
  { id: 'cr_003', name: 'VSL Detox 30s — Corte Rápido', thumbnail_url: '', image_hash: 'a1b2c3d6', entity_id_group: 1, hook_rate: 35, hold_rate: 45, thumbstop_ratio: 28, ctr: 2.1, cpc: 1.60, cpa: 48.00, cpm: 33.60, score: 78, status: 'testing', novelty_days: 3, cpm_trend: [33, 33, 33.5, 33.6], impressions: 45000, spend: 1512 },
  { id: 'cr_004', name: 'Static — Antes/Depois Detox', thumbnail_url: '', image_hash: 'e5f6g7h8', entity_id_group: 2, hook_rate: 28, hold_rate: 0, thumbstop_ratio: 22, ctr: 1.8, cpc: 1.90, cpa: 52.00, cpm: 35.20, score: 68, status: 'testing', novelty_days: 12, cpm_trend: [28, 30, 32, 34, 35, 38, 42, 45, 48, 50, 52, 35.2], impressions: 62000, spend: 2182 },
  { id: 'cr_005', name: 'Static — Antes/Depois Skincare', thumbnail_url: '', image_hash: 'e5f6g7h9', entity_id_group: 2, hook_rate: 25, hold_rate: 0, thumbstop_ratio: 20, ctr: 1.5, cpc: 2.10, cpa: 62.00, cpm: 31.50, score: 55, status: 'testing', novelty_days: 10, cpm_trend: [26, 28, 29, 30, 30.5, 31, 31.5, 32, 33, 31.5], impressions: 48000, spend: 1512 },
  { id: 'cr_006', name: 'Static — Produto + Ingredientes', thumbnail_url: '', image_hash: 'e5f6g7ha', entity_id_group: 2, hook_rate: 20, hold_rate: 0, thumbstop_ratio: 18, ctr: 1.2, cpc: 2.50, cpa: 78.00, cpm: 30.00, score: 42, status: 'loser', novelty_days: 14, cpm_trend: [24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 30], impressions: 35000, spend: 1050 },
  { id: 'cr_007', name: 'Static — Depoimento Cliente', thumbnail_url: '', image_hash: 'e5f6g7hb', entity_id_group: 2, hook_rate: 22, hold_rate: 0, thumbstop_ratio: 19, ctr: 1.3, cpc: 2.30, cpa: 72.00, cpm: 29.90, score: 45, status: 'loser', novelty_days: 11, cpm_trend: [25, 27, 28, 29, 29.5, 30, 30.5, 31, 30, 29.9], impressions: 40000, spend: 1196 },
  { id: 'cr_008', name: 'UGC — Influencer Detox', thumbnail_url: '', image_hash: 'i9j0k1l2', entity_id_group: 3, hook_rate: 45, hold_rate: 62, thumbstop_ratio: 38, ctr: 3.2, cpc: 0.95, cpa: 35.00, cpm: 30.40, score: 95, status: 'winner', novelty_days: 4, cpm_trend: [30, 30.2, 30.5, 30.4], impressions: 92000, spend: 2797 },
  { id: 'cr_009', name: 'UGC — Unboxing Skincare', thumbnail_url: '', image_hash: 'i9j0k1l3', entity_id_group: 3, hook_rate: 40, hold_rate: 55, thumbstop_ratio: 33, ctr: 2.9, cpc: 1.10, cpa: 40.00, cpm: 31.90, score: 88, status: 'winner', novelty_days: 6, cpm_trend: [29, 30, 30.5, 31, 31.5, 31.9], impressions: 78000, spend: 2488 },
  { id: 'cr_010', name: 'UGC — Rotina Manhã', thumbnail_url: '', image_hash: 'i9j0k1l4', entity_id_group: 3, hook_rate: 32, hold_rate: 48, thumbstop_ratio: 26, ctr: 2.2, cpc: 1.50, cpa: 50.00, cpm: 33.00, score: 72, status: 'testing', novelty_days: 2, cpm_trend: [33, 33], impressions: 35000, spend: 1155 },
  { id: 'cr_011', name: 'Carrossel — 5 Produtos Top', thumbnail_url: '', image_hash: 'm3n4o5p6', entity_id_group: 4, hook_rate: 18, hold_rate: 35, thumbstop_ratio: 15, ctr: 0.8, cpc: 3.20, cpa: 120.00, cpm: 25.60, score: 22, status: 'loser', novelty_days: 9, cpm_trend: [22, 23, 24, 24.5, 25, 25.5, 25.6, 26, 25.6], impressions: 52000, spend: 1331 },
  { id: 'cr_012', name: 'Carrossel — Benefícios Colágeno', thumbnail_url: '', image_hash: 'm3n4o5p7', entity_id_group: 4, hook_rate: 22, hold_rate: 40, thumbstop_ratio: 18, ctr: 1.1, cpc: 2.80, cpa: 95.00, cpm: 30.80, score: 35, status: 'loser', novelty_days: 8, cpm_trend: [26, 27, 28, 29, 30, 30.5, 30.8, 30.8], impressions: 44000, spend: 1355 },
  { id: 'cr_013', name: 'Motion — Produto 3D Whey', thumbnail_url: '', image_hash: 'q7r8s9t0', entity_id_group: 5, hook_rate: 35, hold_rate: 50, thumbstop_ratio: 30, ctr: 2.0, cpc: 1.70, cpa: 55.00, cpm: 34.00, score: 70, status: 'testing', novelty_days: 3, cpm_trend: [34, 34, 34], impressions: 28000, spend: 952 },
  { id: 'cr_014', name: 'Motion — Ingredientes Animados', thumbnail_url: '', image_hash: 'q7r8s9t1', entity_id_group: 5, hook_rate: 30, hold_rate: 42, thumbstop_ratio: 25, ctr: 1.8, cpc: 1.90, cpa: 60.00, cpm: 34.20, score: 65, status: 'testing', novelty_days: 3, cpm_trend: [34, 34.1, 34.2], impressions: 25000, spend: 855 },
  { id: 'cr_015', name: 'VSL Skincare 45s — Problema/Solução', thumbnail_url: '', image_hash: 'u1v2w3x4', entity_id_group: 1, hook_rate: 36, hold_rate: 50, thumbstop_ratio: 29, ctr: 2.3, cpc: 1.40, cpa: 46.00, cpm: 32.20, score: 80, status: 'winner', novelty_days: 7, cpm_trend: [30, 30.5, 31, 31.5, 32, 32, 32.2], impressions: 65000, spend: 2093 },
  { id: 'cr_016', name: 'Static — Oferta Limitada BF', thumbnail_url: '', image_hash: 'y5z6a7b8', entity_id_group: 2, hook_rate: 30, hold_rate: 0, thumbstop_ratio: 24, ctr: 1.9, cpc: 1.80, cpa: 54.00, cpm: 34.20, score: 62, status: 'testing', novelty_days: 4, cpm_trend: [33, 33.5, 34, 34.2], impressions: 55000, spend: 1881 },
  { id: 'cr_017', name: 'UGC — Resultados 30 dias', thumbnail_url: '', image_hash: 'c9d0e1f2', entity_id_group: 3, hook_rate: 43, hold_rate: 60, thumbstop_ratio: 36, ctr: 3.0, cpc: 1.00, cpa: 36.00, cpm: 30.00, score: 93, status: 'winner', novelty_days: 2, cpm_trend: [30, 30], impressions: 40000, spend: 1200 },
  { id: 'cr_018', name: 'Reels — Trend Sound Detox', thumbnail_url: '', image_hash: 'g3h4i5j6', entity_id_group: 5, hook_rate: 48, hold_rate: 55, thumbstop_ratio: 40, ctr: 3.5, cpc: 0.85, cpa: 32.00, cpm: 29.75, score: 96, status: 'winner', novelty_days: 1, cpm_trend: [29.75], impressions: 22000, spend: 655 },
  { id: 'cr_019', name: 'Static — Comparativo Preço', thumbnail_url: '', image_hash: 'k7l8m9n0', entity_id_group: 4, hook_rate: 15, hold_rate: 0, thumbstop_ratio: 12, ctr: 0.7, cpc: 3.50, cpa: 135.00, cpm: 24.50, score: 18, status: 'loser', novelty_days: 13, cpm_trend: [20, 21, 22, 22.5, 23, 23, 23.5, 24, 24, 24.5, 24.5, 24.5, 24.5], impressions: 30000, spend: 735 },
  { id: 'cr_020', name: 'VSL Whey 90s — Storytelling', thumbnail_url: '', image_hash: 'o1p2q3r4', entity_id_group: 1, hook_rate: 33, hold_rate: 48, thumbstop_ratio: 27, ctr: 2.0, cpc: 1.65, cpa: 52.00, cpm: 33.00, score: 74, status: 'testing', novelty_days: 6, cpm_trend: [31, 31.5, 32, 32.5, 33, 33], impressions: 50000, spend: 1650 },
  { id: 'cr_021', name: 'UGC — Médico Recomenda', thumbnail_url: '', image_hash: 's5t6u7v8', entity_id_group: 3, hook_rate: 41, hold_rate: 58, thumbstop_ratio: 34, ctr: 2.8, cpc: 1.15, cpa: 39.00, cpm: 32.20, score: 90, status: 'winner', novelty_days: 4, cpm_trend: [31, 31.5, 32, 32.2], impressions: 68000, spend: 2190 },
  { id: 'cr_022', name: 'Motion — Countdown Oferta', thumbnail_url: '', image_hash: 'w9x0y1z2', entity_id_group: 5, hook_rate: 28, hold_rate: 38, thumbstop_ratio: 23, ctr: 1.6, cpc: 2.00, cpa: 65.00, cpm: 32.00, score: 58, status: 'testing', novelty_days: 5, cpm_trend: [31, 31.5, 32, 32, 32], impressions: 32000, spend: 1024 },
  { id: 'cr_023', name: 'Static — Selo Anvisa', thumbnail_url: '', image_hash: 'a3b4c5d6', entity_id_group: 2, hook_rate: 24, hold_rate: 0, thumbstop_ratio: 20, ctr: 1.4, cpc: 2.20, cpa: 68.00, cpm: 30.80, score: 50, status: 'testing', novelty_days: 8, cpm_trend: [26, 27, 28, 29, 30, 30.5, 30.8, 30.8], impressions: 42000, spend: 1294 },
  { id: 'cr_024', name: 'Carrossel — Depoimentos 5 Stars', thumbnail_url: '', image_hash: 'e7f8g9h0', entity_id_group: 4, hook_rate: 20, hold_rate: 32, thumbstop_ratio: 16, ctr: 0.9, cpc: 2.90, cpa: 110.00, cpm: 26.10, score: 28, status: 'loser', novelty_days: 11, cpm_trend: [22, 23, 23.5, 24, 24.5, 25, 25.5, 25.5, 26, 26, 26.1], impressions: 38000, spend: 992 }
];

// 12 ad sets across campaigns
export const mockAdSetsData: AdSet[] = [
  { id: 'as_001', campaign_id: 'camp_001', name: 'Detox — Broad BR 25-55 F', status: 'ACTIVE', optimization_goal: 'OFFSITE_CONVERSIONS', daily_budget: 250, targeting: { geo_locations: { countries: ['BR'] }, age_min: 25, age_max: 55, genders: [2] }, roas: 4.10, cpa: 39.50, ctr: 2.3, cpm: 36.50, spend: 6500, conversions: 165, impressions: 178000, clicks: 4094 },
  { id: 'as_002', campaign_id: 'camp_001', name: 'Detox — Broad BR 25-55 All', status: 'ACTIVE', optimization_goal: 'OFFSITE_CONVERSIONS', daily_budget: 250, targeting: { geo_locations: { countries: ['BR'] }, age_min: 25, age_max: 55 }, roas: 3.50, cpa: 46.40, ctr: 1.9, cpm: 41.80, spend: 5950, conversions: 128, impressions: 142000, clicks: 2698 },
  { id: 'as_003', campaign_id: 'camp_002', name: 'Skincare — LAL 1% Compradoras', status: 'ACTIVE', optimization_goal: 'OFFSITE_CONVERSIONS', daily_budget: 200, targeting: { geo_locations: { countries: ['BR'] }, age_min: 22, age_max: 45, genders: [2], custom_audiences: [{ id: 'ca_001', name: 'LAL 1% Compradoras 180d' }] }, roas: 3.20, cpa: 52.00, ctr: 1.9, cpm: 40.20, spend: 5200, conversions: 100, impressions: 129400, clicks: 2459 },
  { id: 'as_004', campaign_id: 'camp_002', name: 'Skincare — LAL 1% Engajamento', status: 'ACTIVE', optimization_goal: 'OFFSITE_CONVERSIONS', daily_budget: 150, targeting: { geo_locations: { countries: ['BR'] }, age_min: 22, age_max: 45, genders: [2], custom_audiences: [{ id: 'ca_002', name: 'LAL 1% Engajamento IG 90d' }] }, roas: 2.55, cpa: 67.00, ctr: 1.4, cpm: 44.80, spend: 3350, conversions: 50, impressions: 74800, clicks: 1047 },
  { id: 'as_005', campaign_id: 'camp_003', name: 'Whey — Broad BR 18-45 M', status: 'LEARNING', optimization_goal: 'OFFSITE_CONVERSIONS', daily_budget: 100, targeting: { geo_locations: { countries: ['BR'] }, age_min: 18, age_max: 45, genders: [1] }, roas: 1.60, cpa: 82.00, ctr: 1.3, cpm: 50.20, spend: 1640, conversions: 20, impressions: 32700, clicks: 425 },
  { id: 'as_006', campaign_id: 'camp_003', name: 'Whey — Interesse Fitness', status: 'LEARNING', optimization_goal: 'OFFSITE_CONVERSIONS', daily_budget: 100, targeting: { geo_locations: { countries: ['BR'] }, age_min: 18, age_max: 45, genders: [1] }, roas: 1.28, cpa: 97.50, ctr: 1.1, cpm: 54.60, spend: 1560, conversions: 16, impressions: 28600, clicks: 315 },
  { id: 'as_007', campaign_id: 'camp_004', name: 'Retarget — Cart 7d', status: 'ACTIVE', optimization_goal: 'OFFSITE_CONVERSIONS', daily_budget: 80, targeting: { geo_locations: { countries: ['BR'] }, custom_audiences: [{ id: 'ca_003', name: 'Add to Cart 7d' }] }, roas: 5.80, cpa: 25.20, ctr: 4.2, cpm: 68.40, spend: 2270, conversions: 90, impressions: 33200, clicks: 1394 },
  { id: 'as_008', campaign_id: 'camp_004', name: 'Retarget — ViewContent 7d', status: 'ACTIVE', optimization_goal: 'OFFSITE_CONVERSIONS', daily_budget: 70, targeting: { geo_locations: { countries: ['BR'] }, custom_audiences: [{ id: 'ca_004', name: 'ViewContent 7d' }] }, roas: 4.50, cpa: 33.30, ctr: 3.3, cpm: 61.00, spend: 1930, conversions: 58, impressions: 31600, clicks: 1043 },
  { id: 'as_009', campaign_id: 'camp_005', name: 'Colágeno — Interesse Saúde', status: 'PAUSED', optimization_goal: 'OFFSITE_CONVERSIONS', daily_budget: 125, targeting: { geo_locations: { countries: ['BR'] }, age_min: 30, age_max: 60, genders: [2] }, roas: 0.90, cpa: 138.00, ctr: 0.9, cpm: 46.20, spend: 2900, conversions: 21, impressions: 62800, clicks: 565 },
  { id: 'as_010', campaign_id: 'camp_005', name: 'Colágeno — Interesse Beleza', status: 'PAUSED', optimization_goal: 'OFFSITE_CONVERSIONS', daily_budget: 125, targeting: { geo_locations: { countries: ['BR'] }, age_min: 28, age_max: 55, genders: [2] }, roas: 0.72, cpa: 152.00, ctr: 0.7, cpm: 51.20, spend: 2900, conversions: 19, impressions: 56600, clicks: 396 },
  { id: 'as_011', campaign_id: 'camp_006', name: 'BF — Broad Multi-Produto', status: 'LEARNING_LIMITED', optimization_goal: 'OFFSITE_CONVERSIONS', daily_budget: 500, targeting: { geo_locations: { countries: ['BR'] }, age_min: 18, age_max: 65 }, roas: 2.10, cpa: 66.00, ctr: 1.6, cpm: 42.00, spend: 9500, conversions: 144, impressions: 226200, clicks: 3619 },
  { id: 'as_012', campaign_id: 'camp_006', name: 'BF — Retarget Engajamento 30d', status: 'ACTIVE', optimization_goal: 'OFFSITE_CONVERSIONS', daily_budget: 300, targeting: { geo_locations: { countries: ['BR'] }, custom_audiences: [{ id: 'ca_005', name: 'Engajamento 30d' }] }, roas: 1.68, cpa: 82.00, ctr: 1.3, cpm: 49.20, spend: 5700, conversions: 67, impressions: 115900, clicks: 1507 }
];

// Generate ads from creatives
export const mockAdsData: Ad[] = mockCreativesData.map((creative, i) => ({
  id: `ad_${String(i + 1).padStart(3, '0')}`,
  adset_id: mockAdSetsData[i % mockAdSetsData.length].id,
  name: creative.name,
  status: creative.status === 'loser' ? 'PAUSED' as const : creative.status === 'winner' ? 'ACTIVE' as const : 'ACTIVE' as const,
  creative,
  roas: creative.cpa < 50 ? 3.5 : creative.cpa < 80 ? 2.0 : 0.9,
  cpa: creative.cpa,
  ctr: creative.ctr,
  cpm: creative.cpm,
  spend: creative.spend,
  conversions: Math.round(creative.spend / creative.cpa),
  impressions: creative.impressions,
  clicks: Math.round(creative.impressions * creative.ctr / 100),
}));

// Build entity groups from creatives
function buildEntityGroups(): EntityIDGroup[] {
  const groupIds = [...new Set(mockCreativesData.map(c => c.entity_id_group))];
  return groupIds.map(gid => {
    const creatives = mockCreativesData.filter(c => c.entity_id_group === gid);
    return {
      entity_id: gid,
      creatives,
      total_spend: creatives.reduce((s, c) => s + c.spend, 0),
      avg_cpa: creatives.reduce((s, c) => s + c.cpa, 0) / creatives.length,
      is_overcrowded: creatives.length > 3,
    };
  });
}
export const mockEntityGroups: EntityIDGroup[] = buildEntityGroups();

// Mock CAPI Event (basic — for legacy compatibility)
export const mockCAPIEvent: CAPIEvent = {
  event_name: 'Purchase',
  event_time: 1711612800,
  event_id: 'evt_1711612800_a1b2c3d4',
  event_source_url: 'https://checkout.exemplo.com/obrigado',
  action_source: 'website',
  user_data: {
    em: ['a3f5c7d8e1b2...'],
    ph: ['b4g6h8i2j3k4...'],
    external_id: ['c5h7i9j3k4l5...'],
    client_ip_address: '189.42.xxx.xxx',
    client_user_agent: 'Mozilla/5.0 (Linux; Android 14) ...',
    fbp: 'fb.1.1711612800.1234567890',
    fbc: 'fb.1.1711612800.AbCdEfGhIj',
  },
  custom_data: {
    value: 37.00,
    currency: 'BRL',
    content_name: 'Protocolo Detox 21 Dias',
    predicted_ltv: 63.24,
    customer_type: 'new',
    funnel_stage: 'bottom',
    engagement_score: 7.8,
    margin_tier: 'high',
    bump_accepted: true,
    time_on_page: 245,
    scroll_depth: 92,
    video_watched: 78,
  },
};

// Signal Audit mock data — 8 pilares META SIGNAL AUDIT
export const mockSignalAudit: SignalAuditResult = {
  overallMaturity: 72,
  overallRisk: 18,
  zone: 'yellow',
  pillars: [
    {
      id: 'p1', name: 'Semântica dos Eventos',
      maturity: 4, risk: 1, zone: 'green',
      details: ['Purchase representa compra aprovada real', 'ViewContent mapeado corretamente', 'Lead = formulário enviado'],
    },
    {
      id: 'p2', name: 'Pixel + CAPI + Deduplicação',
      maturity: 4, risk: 1, zone: 'green',
      details: ['event_id consistente Pixel↔CAPI', 'Deduplicação ativa', 'Taxa de match 89%'],
    },
    {
      id: 'p3', name: 'Qualidade de Matching (EMQ)',
      maturity: 3, risk: 2, zone: 'yellow',
      details: ['EMQ 6.8 (alvo: 8.0+)', 'Faltam: ZIP, gender, DOB', 'email + phone presentes'],
    },
    {
      id: 'p4', name: 'Valor Econômico',
      maturity: 4, risk: 1, zone: 'green',
      details: ['Value bate com financeiro', 'predicted_ltv enviado', 'margin_tier configurado'],
    },
    {
      id: 'p5', name: 'Fechamento Fora do Site',
      maturity: 2, risk: 3, zone: 'yellow',
      details: ['WhatsApp sem tracking', 'CRM não integrado', 'Vendas offline perdidas'],
    },
    {
      id: 'p6', name: 'Estrutura e Densidade de Sinal',
      maturity: 3, risk: 2, zone: 'yellow',
      details: ['36 conv/semana (alvo: 50)', '3 ad sets abaixo do mínimo', 'Consolidar para melhorar'],
    },
    {
      id: 'p7', name: 'Criativo e Diversidade Real',
      maturity: 4, risk: 1, zone: 'green',
      details: ['5 Entity IDs diferentes', '24 criativos ativos', '1 Entity ID superlotado'],
    },
    {
      id: 'p8', name: 'Observabilidade e Governança',
      maturity: 3, risk: 2, zone: 'yellow',
      details: ['Logs de CAPI ativos', 'Sem auditoria agendada', 'Sem alertas de anomalia'],
    },
  ],
  redLineChecks: [
    { label: 'Compra disparada sem compra aprovada?', value: false },
    { label: 'Valor que não bate com financeiro?', value: false },
    { label: 'Duplicidade deliberada de eventos?', value: false },
    { label: 'Microevento como conversão final?', value: true },
    { label: 'Evento "embelezado" (dados inflados)?', value: false },
  ],
  lastAuditTime: new Date().toISOString(),
};

// Re-export with simpler names for convenience
export const mockCreatives = mockCreativesData;
export const mockAdSets = mockAdSetsData;
export const mockAds = mockAdsData;
