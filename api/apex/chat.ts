import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/apex/chat — Apex Analysis Engine
 *
 * Motor de análise de tráfego pago baseado em regras.
 * Gera respostas dinâmicas a partir dos dados — zero API key necessária.
 * Se ANTHROPIC_API_KEY estiver configurada, usa Claude API para respostas conversacionais.
 *
 * Body: { message: string, context?: ChatContext }
 * Response: { response: string, mode: 'live' | 'engine' }
 */

// ─── Data types ──────────────────────────────────────────────────────────────

interface Campaign {
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
  frequency: number;
  opportunity_score: number;
  learning_days?: number;
  learning_conversions?: number;
}

interface Creative {
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
  spend: number;
  cpm_trend: number[];
}

interface ChatContext {
  cpa?: number;
  roas?: number;
  ctr?: number;
  cpm?: number;
  spend?: number;
  conversions?: number;
  accountScore?: number;
  emqScore?: number;
}

// ─── Campaigns database ──────────────────────────────────────────────────────

const campaigns: Campaign[] = [
  { id: 'c1', name: '[ASC] Protocolo Detox', status: 'ACTIVE', objective: 'OUTCOME_SALES', daily_budget: 500, roas: 3.82, cpa: 42.5, ctr: 2.8, cpm: 32.4, spend: 12450, conversions: 293, impressions: 384259, frequency: 1.8, opportunity_score: 87 },
  { id: 'c2', name: '[ASC] Skincare Premium', status: 'ACTIVE', objective: 'OUTCOME_SALES', daily_budget: 350, roas: 2.91, cpa: 58.3, ctr: 2.1, cpm: 28.6, spend: 8740, conversions: 150, impressions: 305594, frequency: 2.1, opportunity_score: 72 },
  { id: 'c3', name: '[CBO] Colágeno Premium', status: 'ACTIVE', objective: 'OUTCOME_SALES', daily_budget: 200, roas: 0.82, cpa: 124, ctr: 0.9, cpm: 45.2, spend: 4960, conversions: 40, impressions: 109735, frequency: 3.4, opportunity_score: 28 },
  { id: 'c4', name: '[RETARGET] Carrinho Abandonado', status: 'ACTIVE', objective: 'OUTCOME_SALES', daily_budget: 150, roas: 5.21, cpa: 28.9, ctr: 4.2, cpm: 52.1, spend: 3180, conversions: 110, impressions: 61036, frequency: 3.2, opportunity_score: 91 },
  { id: 'c5', name: '[ASC] Black Friday', status: 'LEARNING_LIMITED', objective: 'OUTCOME_SALES', daily_budget: 800, roas: 1.45, cpa: 89, ctr: 1.5, cpm: 38.9, spend: 6230, conversions: 35, impressions: 160154, frequency: 1.4, opportunity_score: 45, learning_days: 18, learning_conversions: 35 },
  { id: 'c6', name: '[CBO] Whey Isolado', status: 'LEARNING', objective: 'OUTCOME_SALES', daily_budget: 300, roas: 1.85, cpa: 67.2, ctr: 1.9, cpm: 31.5, spend: 2410, conversions: 22, impressions: 76508, frequency: 1.2, opportunity_score: 58, learning_days: 8, learning_conversions: 22 },
];

const creatives: Creative[] = [
  { id: 'cr1', name: 'Reels — Trend Sound Detox', entity_id_group: 'A', hook_rate: 48, hold_rate: 65, ctr: 3.2, cpa: 32, cpm: 28.5, score: 96, status: 'winner', novelty_days: 5, spend: 2710, cpm_trend: [27, 27.5, 28, 28.5, 28.5] },
  { id: 'cr2', name: 'UGC — Influencer Detox', entity_id_group: 'A', hook_rate: 45, hold_rate: 62, ctr: 2.9, cpa: 38, cpm: 30.2, score: 95, status: 'winner', novelty_days: 7, spend: 2476, cpm_trend: [29, 29.5, 30, 30.2, 30.2] },
  { id: 'cr3', name: 'UGC — Resultados 30 dias', entity_id_group: 'A', hook_rate: 43, hold_rate: 58, ctr: 2.7, cpa: 41, cpm: 29.8, score: 93, status: 'winner', novelty_days: 2, spend: 834, cpm_trend: [29.8] },
  { id: 'cr4', name: 'Static — Antes/Depois Detox', entity_id_group: 'B', hook_rate: 22, hold_rate: 35, ctr: 1.4, cpa: 72, cpm: 35.2, score: 42, status: 'testing', novelty_days: 12, spend: 1584, cpm_trend: [28, 29, 31, 33, 35.2] },
  { id: 'cr5', name: 'Static — Benefícios Grid', entity_id_group: 'B', hook_rate: 20, hold_rate: 30, ctr: 1.2, cpa: 85, cpm: 36.1, score: 35, status: 'loser', novelty_days: 14, spend: 1372, cpm_trend: [30, 32, 34, 35, 36.1] },
  { id: 'cr6', name: 'Static — Produto Lifestyle', entity_id_group: 'B', hook_rate: 18, hold_rate: 28, ctr: 1.1, cpa: 92, cpm: 37.5, score: 30, status: 'loser', novelty_days: 15, spend: 1200, cpm_trend: [31, 33, 35, 36, 37.5] },
  { id: 'cr7', name: 'Static — Ingredientes', entity_id_group: 'B', hook_rate: 19, hold_rate: 32, ctr: 1.3, cpa: 88, cpm: 34.8, score: 33, status: 'loser', novelty_days: 10, spend: 1218, cpm_trend: [30, 31, 33, 34, 34.8] },
  { id: 'cr8', name: 'Static — Comparativo Preço', entity_id_group: 'B', hook_rate: 15, hold_rate: 25, ctr: 0.7, cpa: 120, cpm: 42.3, score: 18, status: 'loser', novelty_days: 13, spend: 930, cpm_trend: [35, 37, 39, 41, 42.3] },
  { id: 'cr9', name: 'VSL Detox — Hook Curiosidade', entity_id_group: 'C', hook_rate: 42, hold_rate: 55, ctr: 2.5, cpa: 45, cpm: 33.1, score: 88, status: 'winner', novelty_days: 6, spend: 2251, cpm_trend: [32, 32.5, 33, 33, 33.1] },
  { id: 'cr10', name: 'Carrossel — 5 Produtos Top', entity_id_group: 'D', hook_rate: 16, hold_rate: 22, ctr: 0.8, cpa: 120, cpm: 44.5, score: 22, status: 'loser', novelty_days: 11, spend: 801, cpm_trend: [38, 40, 42, 43, 44.5] },
  { id: 'cr11', name: 'Motion 3D — Produto Hero', entity_id_group: 'E', hook_rate: 38, hold_rate: 50, ctr: 2.3, cpa: 48, cpm: 30.8, score: 82, status: 'winner', novelty_days: 4, spend: 1294, cpm_trend: [30.5, 30.8] },
];

const EMQ = {
  score: 6.8, level: 2,
  breakdown: { email: 2.0, phone: 1.5, external_id: 1.5, ip_ua: 1.0, fbp: 0.5, fbc: 0.3 },
};

const THRESHOLDS = {
  ROAS_MIN: 1, CTR_MIN: 1, FREQ_MAX: 3, EMQ_MIN: 8,
  LEARNING_MAX_DAYS: 14, NOVELTY_MAX_DAYS: 7, ENTITY_MAX: 3,
};

// ─── Analysis engine ─────────────────────────────────────────────────────────

function fmt(n: number, d = 2): string { return n.toFixed(d); }
function fmtBRL(n: number): string { return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

function getMetrics(ctx?: ChatContext) {
  return {
    cpa: ctx?.cpa ?? 52.4,
    roas: ctx?.roas ?? 3.24,
    ctr: ctx?.ctr ?? 2.15,
    cpm: ctx?.cpm ?? 33.8,
    spend: ctx?.spend ?? 37970,
    conversions: ctx?.conversions ?? 650,
    accountScore: ctx?.accountScore ?? 74,
    emqScore: ctx?.emqScore ?? 6.8,
  };
}

function scoreLabel(s: number): string {
  return s >= 80 ? 'Excelente' : s >= 60 ? 'Bom' : s >= 40 ? 'Regular' : 'Crítico';
}

/** Agrupa criativos por Entity ID */
function groupByEntity(): Record<string, Creative[]> {
  const g: Record<string, Creative[]> = {};
  for (const c of creatives) (g[c.entity_id_group] ??= []).push(c);
  return g;
}

/** Motor de alertas */
function runAlerts(): string[] {
  const alerts: string[] = [];
  for (const c of campaigns) {
    if (c.roas < THRESHOLDS.ROAS_MIN) alerts.push(`🔴 ${c.name}: ROAS ${fmt(c.roas)}x negativo — PAUSAR`);
    if (c.ctr < THRESHOLDS.CTR_MIN) alerts.push(`🟡 ${c.name}: CTR ${fmt(c.ctr)}% abaixo do mínimo`);
    if (c.frequency > THRESHOLDS.FREQ_MAX) alerts.push(`🟡 ${c.name}: Frequência ${fmt(c.frequency, 1)} — público saturando`);
    if (c.status === 'LEARNING_LIMITED' && (c.learning_days ?? 0) > THRESHOLDS.LEARNING_MAX_DAYS)
      alerts.push(`🔵 ${c.name}: Learning Limited há ${c.learning_days} dias — consolidar ad sets`);
    if (c.opportunity_score >= 80 && c.roas > 2)
      alerts.push(`🟢 ${c.name}: Winner! Score ${c.opportunity_score}, ROAS ${fmt(c.roas)}x — escalar +10%`);
  }
  if (EMQ.score < THRESHOLDS.EMQ_MIN)
    alerts.push(`🟡 EMQ ${fmt(EMQ.score, 1)}/10 abaixo do ideal (${THRESHOLDS.EMQ_MIN}+) — CPA +11%`);
  return alerts;
}

// ─── Analysis functions (one per topic) ──────────────────────────────────────

function analyzeOverview(ctx?: ChatContext): string {
  const m = getMetrics(ctx);
  const active = campaigns.filter(c => c.status === 'ACTIVE');
  const learning = campaigns.filter(c => c.status === 'LEARNING' || c.status === 'LEARNING_LIMITED');
  const winners = campaigns.filter(c => c.opportunity_score >= 70).sort((a, b) => b.roas - a.roas);
  const losers = campaigns.filter(c => c.roas < THRESHOLDS.ROAS_MIN);
  const alerts = runAlerts();
  const totalBudget = campaigns.reduce((s, c) => s + c.daily_budget, 0);
  const wastedSpend = losers.reduce((s, c) => s + c.spend, 0);

  return [
    `**Visão Geral da Conta**`,
    ``,
    `Score: **${m.accountScore}/100** (${scoreLabel(m.accountScore)})`,
    `CPA: ${fmtBRL(m.cpa)} | ROAS: ${fmt(m.roas)}x | CTR: ${fmt(m.ctr)}% | CPM: ${fmtBRL(m.cpm)}`,
    `Investimento total: ${fmtBRL(m.spend)} | Conversões: ${m.conversions}`,
    `Budget diário total: ${fmtBRL(totalBudget)} | EMQ: ${fmt(m.emqScore, 1)}/10 (Nível ${EMQ.level})`,
    ``,
    `**${active.length} campanhas ativas** | **${learning.length} em learning**`,
    ``,
    `**Winners (Score ≥70):**`,
    ...winners.map(c => `- ${c.name}: ROAS ${fmt(c.roas)}x, CPA ${fmtBRL(c.cpa)}, Score ${c.opportunity_score}`),
    ``,
    ...(losers.length ? [
      `**Campanhas com problema (ROAS < ${THRESHOLDS.ROAS_MIN}):**`,
      ...losers.map(c => `- ${c.name}: ROAS ${fmt(c.roas)}x, gastou ${fmtBRL(c.spend)} — **PAUSAR**`),
      `Budget desperdiçado: ${fmtBRL(wastedSpend)} (${fmt(wastedSpend / m.spend * 100, 1)}% do total)`,
      ``,
    ] : []),
    ...(learning.length ? [
      `**Em Learning Phase:**`,
      ...learning.map(c => `- ${c.name}: ${c.learning_conversions}/50 conv, ${c.learning_days} dias (${c.status === 'LEARNING_LIMITED' ? '⚠️ LIMITED' : 'progredindo'})`),
      ``,
    ] : []),
    `**Alertas (${alerts.length}):**`,
    ...alerts,
    ``,
    `**Ação imediata:**`,
    ...losers.map(c => `1. Pausar ${c.name} (economiza ${fmtBRL(c.daily_budget)}/dia)`),
    ...winners.slice(0, 2).map(c => `2. Escalar ${c.name} +10% → ${fmtBRL(c.daily_budget * 1.1)}/dia`),
    `3. Corrigir CAPI para subir EMQ de ${fmt(m.emqScore, 1)} para 8.0+ (CPA -11%)`,
  ].join('\n');
}

function analyzeBidding(ctx?: ChatContext): string {
  const m = getMetrics(ctx);
  const lines: string[] = [`**Estratégia de Lances — Análise por Campanha**`, ''];

  for (const c of campaigns) {
    let strategy: string;
    let reason: string;

    if (c.status === 'LEARNING' || c.status === 'LEARNING_LIMITED') {
      strategy = '⛔ NÃO ALTERAR';
      reason = `Em learning phase (${c.learning_conversions}/50 conv). Qualquer mudança reseta o aprendizado do Andromeda.`;
    } else if (c.roas < THRESHOLDS.ROAS_MIN) {
      strategy = '🛑 PAUSAR';
      reason = `ROAS ${fmt(c.roas)}x negativo. Sem volume suficiente para otimizar lance.`;
    } else if (c.name.includes('RETARGET')) {
      const suggestedCap = Math.round(c.cpa * 1.2);
      strategy = `COST_CAP R$ ${suggestedCap}`;
      reason = `ROAS ${fmt(c.roas)}x forte. Cost cap permite escalar sem perder eficiência. Frequência ${fmt(c.frequency, 1)} — expandir janela de retargeting.`;
    } else if (c.opportunity_score >= 70) {
      strategy = 'LOWEST_COST (manter)';
      reason = `CPA ${fmtBRL(c.cpa)} abaixo da média (${fmtBRL(m.cpa)}). Andromeda encontrando bons clusters. Não limitar.`;
    } else {
      strategy = 'LOWEST_COST + monitorar';
      reason = `Performance mediana. Coletar mais dados antes de mudar estratégia.`;
    }

    lines.push(
      `**${c.name}** (${c.status})`,
      `Recomendação: **${strategy}**`,
      `${reason}`,
      `ROAS: ${fmt(c.roas)}x | CPA: ${fmtBRL(c.cpa)} | Budget: ${fmtBRL(c.daily_budget)}/dia`,
      '',
    );
  }

  lines.push(
    `**Regras de ouro para lances:**`,
    `- Learning phase: NUNCA alterar antes de 50 conv/semana`,
    `- Advantage+ (ASC): broad targeting + lowest cost é o padrão`,
    `- Cost Cap: só quando ROAS > 2x e quer escalar sem perder margem`,
    `- Bid Cap: casos extremos (margem apertada, CPA rígido)`,
  );

  return lines.join('\n');
}

function analyzeCreatives(): string {
  const groups = groupByEntity();
  const winners = creatives.filter(c => c.status === 'winner').sort((a, b) => b.score - a.score);
  const losers = creatives.filter(c => c.status === 'loser').sort((a, b) => a.score - b.score);
  const fatigued = creatives.filter(c => c.novelty_days > THRESHOLDS.NOVELTY_MAX_DAYS);
  const overcrowded = Object.entries(groups).filter(([, v]) => v.length > THRESHOLDS.ENTITY_MAX);
  const totalSpend = creatives.reduce((s, c) => s + c.spend, 0);
  const loserSpend = losers.reduce((s, c) => s + c.spend, 0);

  const lines: string[] = [
    `**Análise de Criativos — ${creatives.length} criativos em ${Object.keys(groups).length} Entity IDs**`,
    '',
  ];

  // Entity ID analysis
  for (const [gid, crs] of Object.entries(groups)) {
    const isOver = crs.length > THRESHOLDS.ENTITY_MAX;
    const avgScore = Math.round(crs.reduce((s, c) => s + c.score, 0) / crs.length);
    const grpSpend = crs.reduce((s, c) => s + c.spend, 0);

    lines.push(
      `**Entity ID Group ${gid}** — ${crs.length} criativos ${isOver ? '🔴 OVERCROWDED' : '✅'}`,
      `Score médio: ${avgScore} | Spend: ${fmtBRL(grpSpend)} | ${isOver ? `Andromeda trata como 1 ticket (${crs.length} > ${THRESHOLDS.ENTITY_MAX})` : 'Dentro do limite'}`,
    );

    for (const cr of crs.sort((a, b) => b.score - a.score)) {
      const cpmRise = cr.cpm_trend.length >= 2 ? ((cr.cpm_trend[cr.cpm_trend.length - 1] - cr.cpm_trend[0]) / cr.cpm_trend[0]) * 100 : 0;
      const fatigueFlag = cr.novelty_days > THRESHOLDS.NOVELTY_MAX_DAYS ? ' 🔴 FADIGA' : '';
      lines.push(`  ${cr.score >= 70 ? '✅' : cr.score >= 40 ? '🟡' : '🔴'} ${cr.name} — Score ${cr.score}, Hook ${cr.hook_rate}%, CPA ${fmtBRL(cr.cpa)}${fatigueFlag}${cpmRise > 15 ? ` CPM +${fmt(cpmRise, 0)}%` : ''}`);
    }
    lines.push('');
  }

  lines.push(
    `---`,
    `**Resumo executivo:**`,
    `- **${winners.length} winners** para escalar: ${winners.slice(0, 3).map(c => c.name).join(', ')}`,
    `- **${losers.length} losers** para pausar (${fmtBRL(loserSpend)} desperdiçados — ${fmt(loserSpend / totalSpend * 100, 1)}% do spend)`,
    `- **${fatigued.length} com fadiga** (${THRESHOLDS.NOVELTY_MAX_DAYS}+ dias): ${fatigued.map(c => c.name).join(', ')}`,
    `- **${overcrowded.length} Entity IDs overcrowded**: ${overcrowded.map(([k, v]) => `Group ${k} (${v.length})`).join(', ') || 'nenhum'}`,
    ``,
    `**Plano de ação:**`,
    `1. Pausar losers: ${losers.slice(0, 3).map(c => c.name).join(', ')} → economiza ${fmtBRL(loserSpend / 30)}/dia`,
    `2. Escalar winners frescos: ${winners.filter(c => c.novelty_days <= THRESHOLDS.NOVELTY_MAX_DAYS).slice(0, 2).map(c => `${c.name} (${c.novelty_days}d)`).join(', ')}`,
    `3. Criar 3 novos criativos em formatos diferentes para novos Entity IDs`,
    `4. ${overcrowded.length ? `Diversificar Group ${overcrowded[0][0]}: remover ${overcrowded[0][1].length - THRESHOLDS.ENTITY_MAX} criativos` : 'Entity IDs balanceados ✅'}`,
  );

  return lines.join('\n');
}

function analyzeHooks(): string {
  const sorted = [...creatives].sort((a, b) => b.hook_rate - a.hook_rate);
  const top = sorted.filter(c => c.hook_rate >= 40);
  const poor = sorted.filter(c => c.hook_rate < 25);
  const avgHook = creatives.reduce((s, c) => s + c.hook_rate, 0) / creatives.length;
  const avgHold = creatives.reduce((s, c) => s + c.hold_rate, 0) / creatives.length;
  const topAvgCPA = top.reduce((s, c) => s + c.cpa, 0) / top.length;
  const poorAvgCPA = poor.length ? poor.reduce((s, c) => s + c.cpa, 0) / poor.length : 0;

  return [
    `**Análise de Hooks — ${creatives.length} criativos**`,
    `Média geral: Hook ${fmt(avgHook, 0)}% | Hold ${fmt(avgHold, 0)}%`,
    '',
    `**Top Hooks (≥40%)** — CPA médio ${fmtBRL(topAvgCPA)}:`,
    ...top.map((c, i) => `${i + 1}. **${c.name}** — Hook: ${c.hook_rate}%, Hold: ${c.hold_rate}%, CPA: ${fmtBRL(c.cpa)}`),
    '',
    `**Hooks fracos (<25%)** — CPA médio ${fmtBRL(poorAvgCPA)} (+${fmt((poorAvgCPA / topAvgCPA - 1) * 100, 0)}%):`,
    ...poor.map(c => `- ${c.name} — Hook: ${c.hook_rate}%, CPA: ${fmtBRL(c.cpa)}`),
    '',
    `**Correlação Hook Rate ↔ CPA:**`,
    `Hook ≥40% = CPA médio ${fmtBRL(topAvgCPA)} vs Hook <25% = CPA médio ${fmtBRL(poorAvgCPA)}`,
    `Diferença: **${fmt((poorAvgCPA / topAvgCPA - 1) * 100, 0)}% mais caro** com hook fraco`,
    '',
    `**Padrões vencedores:**`,
    `- Pattern interrupt nos primeiros 0.5s (som trend, corte rápido, movimento)`,
    `- Face humana + expressão emocional = +15% hook rate vs produto puro`,
    `- UGC/Reels: hook médio ${fmt(top.reduce((s, c) => s + c.hook_rate, 0) / top.length, 0)}% vs statics ${fmt(poor.reduce((s, c) => s + c.hook_rate, 0) / poor.length, 0)}%`,
    `- Hold rate >55% = conteúdo pós-hook entrega valor`,
    '',
    `**Próximos hooks para testar:**`,
    `1. Curiosity gap: "Você não vai acreditar no que aconteceu..."`,
    `2. Áudio trend + visual inesperado`,
    `3. Close-up resultado real + corte para produto`,
    `4. Depoimento emocional nos primeiros 3s`,
    '',
    `**Regra Meta:** Primeiros 3 segundos determinam qualidade. Hook fraco = CPM mais alto.`,
  ].join('\n');
}

function analyzeAndromeda(): string {
  const groups = groupByEntity();
  const overcrowded = Object.entries(groups).filter(([, v]) => v.length > THRESHOLDS.ENTITY_MAX);
  const broadCamps = campaigns.filter(c => c.name.includes('ASC') || c.name.includes('BROAD'));
  const interestCamps = campaigns.filter(c => c.name.includes('CBO'));
  const broadAvgScore = broadCamps.reduce((s, c) => s + c.opportunity_score, 0) / broadCamps.length;
  const interestAvgScore = interestCamps.length ? interestCamps.reduce((s, c) => s + c.opportunity_score, 0) / interestCamps.length : 0;
  const effectiveTickets = Object.keys(groups).length - overcrowded.length;

  return [
    `**Andromeda + GEM — Impacto nas Suas Campanhas**`,
    '',
    `O Andromeda filtra bilhões de ads para ~1.000 candidatos em <200ms (NVIDIA Grace Hopper + MTIA v2).`,
    `O GEM (escala GPT-4) rankeia os candidatos finais, aprendendo cross-platform (IG↔FB).`,
    '',
    `**1. Entity ID Clustering:**`,
    `${creatives.length} criativos em ${Object.keys(groups).length} Entity IDs → **${effectiveTickets + overcrowded.length} tickets aparentes, ${effectiveTickets} efetivos**`,
    ...overcrowded.map(([k, v]) => `- Group ${k}: ${v.length} criativos tratados como 1 ticket (overcrowded)`),
    overcrowded.length ? `⚠️ Você perde ${overcrowded.reduce((s, [, v]) => s + v.length - 1, 0)} tickets no leilão` : `✅ Todos os Entity IDs estão otimizados`,
    '',
    `**2. Broad vs Interesses:**`,
    `- Broad/ASC: Score médio **${fmt(broadAvgScore, 0)}** (${broadCamps.map(c => c.name).join(', ')})`,
    `- CBO/Interesses: Score médio **${fmt(interestAvgScore, 0)}** (${interestCamps.map(c => c.name).join(', ')})`,
    `- Diferença: **${fmt(broadAvgScore - interestAvgScore, 0)} pontos** a favor do broad targeting`,
    `O Andromeda 2025 encontra públicos melhor que segmentação manual.`,
    '',
    `**3. Learning Phase:**`,
    ...campaigns.filter(c => c.status === 'LEARNING' || c.status === 'LEARNING_LIMITED').map(c =>
      `- ${c.name}: ${c.learning_conversions}/50 conv em ${c.learning_days}d ${c.status === 'LEARNING_LIMITED' ? '⚠️ LIMITED — consolidar ad sets ou aumentar budget' : '— progredindo normalmente'}`
    ),
    `O Andromeda calibra nos primeiros 50 conv/semana. Abaixo disso = "foto borrada".`,
    '',
    `**4. GEM Cross-Platform:**`,
    `UGCs performam melhor no IG (+5% conv) | VSLs performam melhor no FB Feed (+3%)`,
    `Garanta que criativos estejam otimizados para IG Reels (formato que mais performa em ASC).`,
    '',
    `**Ações:**`,
    `1. ${interestCamps.filter(c => c.roas < THRESHOLDS.ROAS_MIN).map(c => `Pausar ${c.name} (interesses manual falhou)`).join('; ') || 'Campanhas de interesses OK'}`,
    `2. Diversificar Entity IDs — criar criativos visualmente distintos`,
    `3. Confiar no broad targeting para novas campanhas`,
  ].join('\n');
}

function analyzeSignal(ctx?: ChatContext): string {
  const m = getMetrics(ctx);
  const { breakdown } = EMQ;
  const cpaSavings = m.cpa * 0.11;
  const totalSavings = cpaSavings * m.conversions;

  return [
    `**Signal Engineering — EMQ ${fmt(m.emqScore, 1)}/10 (Nível ${EMQ.level})**`,
    '',
    `| Parâmetro | Score | Máx | Status |`,
    `|-----------|-------|-----|--------|`,
    `| Email (em) | ${breakdown.email} | 2.0 | ${breakdown.email >= 2.0 ? '✅' : '⚠️'} |`,
    `| Phone (ph) | ${breakdown.phone} | 1.5 | ${breakdown.phone >= 1.5 ? '✅' : '⚠️'} |`,
    `| External ID | ${breakdown.external_id} | 1.5 | ${breakdown.external_id >= 1.5 ? '✅' : '⚠️'} |`,
    `| IP + User Agent | ${breakdown.ip_ua} | 1.0 | ${breakdown.ip_ua >= 1.0 ? '✅' : '⚠️'} |`,
    `| FBP (cookie) | ${breakdown.fbp} | 0.5 | ${breakdown.fbp >= 0.5 ? '✅' : '⚠️'} |`,
    `| FBC (click ID) | ${breakdown.fbc} | 0.5 | ⚠️ -${fmt(0.5 - breakdown.fbc, 1)} |`,
    '',
    `**Impacto financeiro:**`,
    `EMQ ${fmt(m.emqScore, 1)} → 8.0 = CPA -11%`,
    `De ${fmtBRL(m.cpa)} para ~${fmtBRL(m.cpa * 0.89)}`,
    `**Economia estimada: ${fmtBRL(totalSavings)}/período** (${m.conversions} conv × ${fmtBRL(cpaSavings)})`,
    '',
    `**Para Nível 3 (quick win):**`,
    `- Corrigir captura de FBC (click IDs) — gap de ${fmt(0.5 - breakdown.fbc, 1)}`,
    '',
    `**Para Nível 4 (EMQ 8.5+):**`,
    `Adicionar ao custom_data do CAPI:`,
    `- \`predicted_ltv\`: valor previsto de lifetime value`,
    `- \`margin_tier\`: "high" | "medium" | "low"`,
    `- \`engagement_score\`: 0-10 baseado em comportamento no site`,
    '',
    `**Para Nível 5 (Synthetic Events — 0.01% dos anunciantes):**`,
    `- **DeepEngagement**: scroll 75% + 2min na landing page`,
    `- **HighIntentVisitor**: 3+ visitas em 48h`,
    `- **QualifiedLead**: lead score > 70`,
    `- **PredictedBuyer**: buyer prediction > 0.7`,
    '',
    `Eventos sintéticos ensinam o Andromeda comportamentos pré-compra que ele não consegue ver sozinho.`,
  ].join('\n');
}

function analyzeScaling(ctx?: ChatContext): string {
  const m = getMetrics(ctx);
  const lines: string[] = [`**Recomendações de Scaling**`, `CPA alvo: ${fmtBRL(m.cpa)} | Regra: máx +10% a cada 48h`, ''];

  let savingsPerDay = 0;
  let extraBudget = 0;

  for (const c of campaigns) {
    if (c.status === 'LEARNING' || c.status === 'LEARNING_LIMITED') {
      lines.push(`⏳ **${c.name}**: NÃO ALTERAR — ${c.learning_conversions}/50 conv em learning phase`);
    } else if (c.roas < THRESHOLDS.ROAS_MIN) {
      lines.push(`🛑 **${c.name}**: PAUSAR — ROAS ${fmt(c.roas)}x negativo (economiza ${fmtBRL(c.daily_budget)}/dia)`);
      savingsPerDay += c.daily_budget;
    } else if (c.opportunity_score >= 70 && c.cpa < m.cpa && c.roas > THRESHOLDS.ROAS_MIN) {
      const increase = c.daily_budget * 0.1;
      lines.push(`✅ **${c.name}**: ESCALAR +10% → ${fmtBRL(c.daily_budget)} → ${fmtBRL(c.daily_budget + increase)}/dia (CPA ${fmtBRL(c.cpa)}, ROAS ${fmt(c.roas)}x)`);
      extraBudget += increase;
    } else {
      lines.push(`👀 **${c.name}**: MONITORAR — sem ação necessária`);
    }
    lines.push('');
  }

  lines.push(
    `---`,
    `**Impacto das ações:**`,
    `- Budget economizado (pausas): ${fmtBRL(savingsPerDay)}/dia = ${fmtBRL(savingsPerDay * 30)}/mês`,
    `- Budget adicionado (scaling): ${fmtBRL(extraBudget)}/dia`,
    `- Realocação líquida: ${fmtBRL(savingsPerDay - extraBudget)}/dia disponível`,
    '',
    `**Regras de segurança:**`,
    `- Máximo +10% por ajuste`,
    `- Cooldown 48h entre ajustes`,
    `- Mínimo 7 dias de dados antes de decisão`,
    `- NUNCA alterar campanhas em learning phase`,
  );

  return lines.join('\n');
}

// ─── Intent detection + routing ──────────────────────────────────────────────

type AnalysisFn = (ctx?: ChatContext) => string;

const INTENTS: Array<{ keywords: string[]; fn: AnalysisFn }> = [
  { keywords: ['visao geral', 'overview', 'geral', 'resumo', 'conta', 'dashboard'], fn: analyzeOverview },
  { keywords: ['lance', 'bid', 'estrategia de lance', 'bidding', 'cost cap', 'lowest cost'], fn: analyzeBidding },
  { keywords: ['criativ', 'entity', 'creative', 'criativos', 'entity id'], fn: analyzeCreatives },
  { keywords: ['hook', 'hold rate', 'hook rate', 'primeiros 3', 'retenção'], fn: analyzeHooks },
  { keywords: ['andromeda', 'algoritmo', 'gem', 'ranking', 'leilao', 'auction'], fn: analyzeAndromeda },
  { keywords: ['emq', 'signal', 'capi', 'conversions api', 'pixel', 'evento'], fn: analyzeSignal },
  { keywords: ['escal', 'scaling', 'budget', 'pausar', 'orcamento', 'otimiz'], fn: analyzeScaling },
];

function detectAndRun(message: string, ctx?: ChatContext): string {
  const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const intent of INTENTS) {
    if (intent.keywords.some(k => lower.includes(k))) {
      return intent.fn(ctx);
    }
  }

  // Fallback: overview + quick summary de cada área
  const m = getMetrics(ctx);
  const alerts = runAlerts();
  const winners = campaigns.filter(c => c.opportunity_score >= 70);
  const losers = campaigns.filter(c => c.roas < THRESHOLDS.ROAS_MIN);
  const fatigued = creatives.filter(c => c.novelty_days > THRESHOLDS.NOVELTY_MAX_DAYS);

  return [
    `**Apex — Diagnóstico Rápido**`,
    '',
    `Score: **${m.accountScore}/100** | CPA: ${fmtBRL(m.cpa)} | ROAS: ${fmt(m.roas)}x | EMQ: ${fmt(m.emqScore, 1)}/10`,
    '',
    `**${alerts.length} alertas** | **${winners.length} winners** | **${losers.length} para pausar** | **${fatigued.length} com fadiga**`,
    '',
    `**Top 3 ações de maior impacto:**`,
    losers.length ? `1. 🛑 Pausar ${losers[0].name} — ROAS ${fmt(losers[0].roas)}x negativo, economiza ${fmtBRL(losers[0].daily_budget)}/dia` : `1. ✅ Nenhuma campanha com ROAS negativo`,
    winners.length ? `2. ✅ Escalar ${winners[0].name} +10% — ROAS ${fmt(winners[0].roas)}x, Score ${winners[0].opportunity_score}` : `2. ⏳ Nenhum winner claro ainda`,
    m.emqScore < THRESHOLDS.EMQ_MIN ? `3. 📡 Corrigir Signal Engineering — EMQ ${fmt(m.emqScore, 1)} → 8.0 = CPA -11% (${fmtBRL(m.cpa * 0.11 * m.conversions)}/período)` : `3. ✅ EMQ saudável`,
    '',
    `Pergunte sobre um tema específico:`,
    `- "analise meus criativos"`,
    `- "estratégia de lances"`,
    `- "como melhorar meu EMQ"`,
    `- "quais campanhas escalar"`,
    `- "análise de hooks"`,
    `- "como o Andromeda afeta minhas campanhas"`,
  ].join('\n');
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // Health check
  if (req.method === 'GET') {
    return res.json({
      ok: true,
      mode: process.env.ANTHROPIC_API_KEY ? 'live' : 'engine',
      version: '1.1.0',
      name: 'apex-engine',
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, context } = req.body as { message?: string; context?: ChatContext };
  if (!message?.trim()) return res.status(400).json({ error: 'Missing "message" field' });

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // COM API key → Claude API para respostas conversacionais
  if (apiKey) {
    try {
      const analysisContext = detectAndRun(message, context);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: `Você é o Apex, consultor especialista em Meta Ads. O motor de análise já processou os dados. Use os resultados abaixo para responder de forma conversacional e dar recomendações adicionais.\n\n${analysisContext}`,
          messages: [{ role: 'user', content: message }],
        }),
      });

      if (response.ok) {
        const data = await response.json() as { content: Array<{ type: string; text?: string }> };
        const text = data.content?.filter(b => b.type === 'text').map(b => b.text ?? '').join('');
        return res.json({ response: text, mode: 'live' });
      }
    } catch { /* fall through to engine mode */ }
  }

  // SEM API key (ou API falhou) → motor de análise puro
  return res.json({ response: detectAndRun(message, context), mode: 'engine' });
}
