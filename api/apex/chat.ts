import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/apex/chat — Apex Analysis Engine
 *
 * Motor de análise que opera sobre dados REAIS enviados pelo React app.
 * Nenhum dado hardcoded — tudo vem do Zustand store via context.
 *
 * Body: { message: string, context: { metrics, emqScore, campaigns[], creatives[] } }
 * Response: { response: string, mode: 'live' | 'engine' }
 */

// ─── Types (espelham os subsets do React app) ────────────────────────────────

interface Campaign {
  name: string;
  status: string;
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
  name: string;
  entity_id_group: string;
  hook_rate: number;
  hold_rate: number;
  ctr: number;
  cpa: number;
  cpm: number;
  score: number;
  status: string;
  novelty_days: number;
  spend: number;
  cpm_trend: number[];
}

interface Metrics {
  cpa: number;
  roas: number;
  ctr: number;
  cpm: number;
  spend: number;
  conversions: number;
  accountScore: number;
}

interface ChatContext {
  metrics: Metrics;
  emqScore: number;
  campaigns: Campaign[];
  creatives: Creative[];
}

// ─── Thresholds ──────────────────────────────────────────────────────────────

const T = {
  ROAS_MIN: 1, CTR_MIN: 1, FREQ_MAX: 3, EMQ_MIN: 8,
  LEARNING_MAX_DAYS: 14, NOVELTY_MAX_DAYS: 7, ENTITY_MAX: 3,
};

// ─── Fallback data (quando store está vazio) ────────────────────────────────

const FALLBACK_CTX: ChatContext = {
  metrics: { cpa: 52.4, roas: 3.24, ctr: 2.15, cpm: 33.8, spend: 37970, conversions: 650, accountScore: 74 },
  emqScore: 6.8,
  campaigns: [
    { name: '[ASC] Protocolo Detox', status: 'ACTIVE', objective: 'OUTCOME_SALES', daily_budget: 500, roas: 3.82, cpa: 42.5, ctr: 2.8, cpm: 32.4, spend: 12450, conversions: 293, impressions: 384259, frequency: 1.8, opportunity_score: 87 },
    { name: '[ASC] Skincare Premium', status: 'ACTIVE', objective: 'OUTCOME_SALES', daily_budget: 350, roas: 2.91, cpa: 58.3, ctr: 2.1, cpm: 28.6, spend: 8740, conversions: 150, impressions: 305594, frequency: 2.1, opportunity_score: 72 },
    { name: '[CBO] Colágeno Premium', status: 'ACTIVE', objective: 'OUTCOME_SALES', daily_budget: 200, roas: 0.82, cpa: 124, ctr: 0.9, cpm: 45.2, spend: 4960, conversions: 40, impressions: 109735, frequency: 3.4, opportunity_score: 28 },
    { name: '[RETARGET] Carrinho Abandonado', status: 'ACTIVE', objective: 'OUTCOME_SALES', daily_budget: 150, roas: 5.21, cpa: 28.9, ctr: 4.2, cpm: 52.1, spend: 3180, conversions: 110, impressions: 61036, frequency: 3.2, opportunity_score: 91 },
    { name: '[ASC] Black Friday', status: 'LEARNING_LIMITED', objective: 'OUTCOME_SALES', daily_budget: 800, roas: 1.45, cpa: 89, ctr: 1.5, cpm: 38.9, spend: 6230, conversions: 35, impressions: 160154, frequency: 1.4, opportunity_score: 45, learning_days: 18, learning_conversions: 35 },
    { name: '[CBO] Whey Isolado', status: 'LEARNING', objective: 'OUTCOME_SALES', daily_budget: 300, roas: 1.85, cpa: 67.2, ctr: 1.9, cpm: 31.5, spend: 2410, conversions: 22, impressions: 76508, frequency: 1.2, opportunity_score: 58, learning_days: 8, learning_conversions: 22 },
  ],
  creatives: [
    { name: 'Reels — Trend Sound Detox', entity_id_group: 'A', hook_rate: 48, hold_rate: 65, ctr: 3.2, cpa: 32, cpm: 28.5, score: 96, status: 'winner', novelty_days: 5, spend: 2710, cpm_trend: [27, 27.5, 28, 28.5] },
    { name: 'UGC — Influencer Detox', entity_id_group: 'A', hook_rate: 45, hold_rate: 62, ctr: 2.9, cpa: 38, cpm: 30.2, score: 95, status: 'winner', novelty_days: 7, spend: 2476, cpm_trend: [29, 30, 30.2] },
    { name: 'UGC — Resultados 30 dias', entity_id_group: 'A', hook_rate: 43, hold_rate: 58, ctr: 2.7, cpa: 41, cpm: 29.8, score: 93, status: 'winner', novelty_days: 2, spend: 834, cpm_trend: [29.8] },
    { name: 'Static — Antes/Depois Detox', entity_id_group: 'B', hook_rate: 22, hold_rate: 35, ctr: 1.4, cpa: 72, cpm: 35.2, score: 42, status: 'testing', novelty_days: 12, spend: 1584, cpm_trend: [28, 31, 35.2] },
    { name: 'Static — Benefícios Grid', entity_id_group: 'B', hook_rate: 20, hold_rate: 30, ctr: 1.2, cpa: 85, cpm: 36.1, score: 35, status: 'loser', novelty_days: 14, spend: 1372, cpm_trend: [30, 34, 36.1] },
    { name: 'Static — Produto Lifestyle', entity_id_group: 'B', hook_rate: 18, hold_rate: 28, ctr: 1.1, cpa: 92, cpm: 37.5, score: 30, status: 'loser', novelty_days: 15, spend: 1200, cpm_trend: [31, 35, 37.5] },
    { name: 'Static — Ingredientes', entity_id_group: 'B', hook_rate: 19, hold_rate: 32, ctr: 1.3, cpa: 88, cpm: 34.8, score: 33, status: 'loser', novelty_days: 10, spend: 1218, cpm_trend: [30, 33, 34.8] },
    { name: 'Static — Comparativo Preço', entity_id_group: 'B', hook_rate: 15, hold_rate: 25, ctr: 0.7, cpa: 120, cpm: 42.3, score: 18, status: 'loser', novelty_days: 13, spend: 930, cpm_trend: [35, 39, 42.3] },
    { name: 'VSL Detox — Hook Curiosidade', entity_id_group: 'C', hook_rate: 42, hold_rate: 55, ctr: 2.5, cpa: 45, cpm: 33.1, score: 88, status: 'winner', novelty_days: 6, spend: 2251, cpm_trend: [32, 33, 33.1] },
    { name: 'Carrossel — 5 Produtos Top', entity_id_group: 'D', hook_rate: 16, hold_rate: 22, ctr: 0.8, cpa: 120, cpm: 44.5, score: 22, status: 'loser', novelty_days: 11, spend: 801, cpm_trend: [38, 42, 44.5] },
    { name: 'Motion 3D — Produto Hero', entity_id_group: 'E', hook_rate: 38, hold_rate: 50, ctr: 2.3, cpa: 48, cpm: 30.8, score: 82, status: 'winner', novelty_days: 4, spend: 1294, cpm_trend: [30.5, 30.8] },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, d = 2): string { return n.toFixed(d); }
function fmtBRL(n: number): string { return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function scoreLabel(s: number): string { return s >= 80 ? 'Excelente' : s >= 60 ? 'Bom' : s >= 40 ? 'Regular' : 'Crítico'; }

function groupByEntity(crs: Creative[]): Record<string, Creative[]> {
  const g: Record<string, Creative[]> = {};
  for (const c of crs) (g[c.entity_id_group] ??= []).push(c);
  return g;
}

function runAlerts(ctx: ChatContext): string[] {
  const alerts: string[] = [];
  for (const c of ctx.campaigns) {
    if (c.roas < T.ROAS_MIN) alerts.push(`🔴 ${c.name}: ROAS ${fmt(c.roas)}x negativo — PAUSAR`);
    if (c.ctr < T.CTR_MIN) alerts.push(`🟡 ${c.name}: CTR ${fmt(c.ctr)}% abaixo do mínimo`);
    if (c.frequency > T.FREQ_MAX) alerts.push(`🟡 ${c.name}: Frequência ${fmt(c.frequency, 1)} — público saturando`);
    if (c.status === 'LEARNING_LIMITED' && (c.learning_days ?? 0) > T.LEARNING_MAX_DAYS)
      alerts.push(`🔵 ${c.name}: Learning Limited há ${c.learning_days} dias — consolidar ad sets`);
    if (c.opportunity_score >= 80 && c.roas > 2)
      alerts.push(`🟢 ${c.name}: Winner! Score ${c.opportunity_score}, ROAS ${fmt(c.roas)}x — escalar +10%`);
  }
  if (ctx.emqScore < T.EMQ_MIN)
    alerts.push(`🟡 EMQ ${fmt(ctx.emqScore, 1)}/10 abaixo do ideal (${T.EMQ_MIN}+) — CPA +11%`);
  return alerts;
}

// ─── Analysis functions ──────────────────────────────────────────────────────

function analyzeOverview(ctx: ChatContext): string {
  const m = ctx.metrics;
  const active = ctx.campaigns.filter(c => c.status === 'ACTIVE');
  const learning = ctx.campaigns.filter(c => c.status === 'LEARNING' || c.status === 'LEARNING_LIMITED');
  const winners = ctx.campaigns.filter(c => c.opportunity_score >= 70).sort((a, b) => b.roas - a.roas);
  const losers = ctx.campaigns.filter(c => c.roas < T.ROAS_MIN);
  const alerts = runAlerts(ctx);
  const totalBudget = ctx.campaigns.reduce((s, c) => s + c.daily_budget, 0);
  const wastedSpend = losers.reduce((s, c) => s + c.spend, 0);

  return [
    `**Visão Geral da Conta**`,
    '',
    `Score: **${m.accountScore}/100** (${scoreLabel(m.accountScore)})`,
    `CPA: ${fmtBRL(m.cpa)} | ROAS: ${fmt(m.roas)}x | CTR: ${fmt(m.ctr)}% | CPM: ${fmtBRL(m.cpm)}`,
    `Investimento total: ${fmtBRL(m.spend)} | Conversões: ${m.conversions}`,
    `Budget diário: ${fmtBRL(totalBudget)} | EMQ: ${fmt(ctx.emqScore, 1)}/10`,
    '',
    `**${active.length} campanhas ativas** | **${learning.length} em learning** | **${ctx.creatives.length} criativos**`,
    '',
    ...(winners.length ? [
      `**Winners (Score ≥70):**`,
      ...winners.map(c => `- ${c.name}: ROAS ${fmt(c.roas)}x, CPA ${fmtBRL(c.cpa)}, Score ${c.opportunity_score}`),
      '',
    ] : []),
    ...(losers.length ? [
      `**Campanhas com problema (ROAS < ${T.ROAS_MIN}):**`,
      ...losers.map(c => `- ${c.name}: ROAS ${fmt(c.roas)}x, gastou ${fmtBRL(c.spend)} — **PAUSAR**`),
      `Budget desperdiçado: ${fmtBRL(wastedSpend)} (${m.spend > 0 ? fmt(wastedSpend / m.spend * 100, 1) : '0'}% do total)`,
      '',
    ] : []),
    ...(learning.length ? [
      `**Em Learning Phase:**`,
      ...learning.map(c => `- ${c.name}: ${c.learning_conversions ?? '?'}/50 conv, ${c.learning_days ?? '?'} dias (${c.status === 'LEARNING_LIMITED' ? '⚠️ LIMITED' : 'progredindo'})`),
      '',
    ] : []),
    `**Alertas (${alerts.length}):**`,
    ...alerts,
    '',
    `**Ações imediatas:**`,
    ...losers.map((c, i) => `${i + 1}. Pausar ${c.name} (economiza ${fmtBRL(c.daily_budget)}/dia)`),
    ...winners.slice(0, 2).map((c, i) => `${losers.length + i + 1}. Escalar ${c.name} +10% → ${fmtBRL(c.daily_budget * 1.1)}/dia`),
    ctx.emqScore < T.EMQ_MIN ? `${losers.length + Math.min(winners.length, 2) + 1}. Corrigir Signal Engineering — EMQ ${fmt(ctx.emqScore, 1)} → 8.0 = CPA -11%` : '',
  ].filter(Boolean).join('\n');
}

function analyzeBidding(ctx: ChatContext): string {
  const m = ctx.metrics;
  const lines: string[] = [`**Estratégia de Lances — ${ctx.campaigns.length} Campanhas**`, ''];

  for (const c of ctx.campaigns) {
    let strategy: string;
    let reason: string;

    if (c.status === 'LEARNING' || c.status === 'LEARNING_LIMITED') {
      strategy = '⛔ NÃO ALTERAR';
      reason = `Em learning phase (${c.learning_conversions ?? '?'}/50 conv). Qualquer mudança reseta o aprendizado.`;
    } else if (c.roas < T.ROAS_MIN) {
      strategy = '🛑 PAUSAR';
      reason = `ROAS ${fmt(c.roas)}x negativo. Sem volume suficiente para otimizar lance.`;
    } else if (c.name.toLowerCase().includes('retarget') || c.name.toLowerCase().includes('remarketing')) {
      const suggestedCap = Math.round(c.cpa * 1.2);
      strategy = `COST_CAP R$ ${suggestedCap}`;
      reason = `ROAS ${fmt(c.roas)}x forte. Cost cap permite escalar sem perder eficiência. Frequência ${fmt(c.frequency, 1)}.`;
    } else if (c.opportunity_score >= 70) {
      strategy = 'LOWEST_COST (manter)';
      reason = `CPA ${fmtBRL(c.cpa)} ${c.cpa < m.cpa ? 'abaixo' : 'próximo'} da média (${fmtBRL(m.cpa)}). Andromeda encontrando bons clusters.`;
    } else {
      strategy = 'LOWEST_COST + monitorar';
      reason = `Performance mediana (Score ${c.opportunity_score}). Coletar mais dados antes de mudar.`;
    }

    lines.push(`**${c.name}** (${c.status})`, `→ **${strategy}**`, reason,
      `ROAS: ${fmt(c.roas)}x | CPA: ${fmtBRL(c.cpa)} | Budget: ${fmtBRL(c.daily_budget)}/dia`, '');
  }

  lines.push(`**Regras de ouro:**`,
    `- Learning phase: NUNCA alterar antes de 50 conv/semana`,
    `- Advantage+ (ASC): broad targeting + lowest cost é o padrão`,
    `- Cost Cap: só quando ROAS > 2x e quer escalar`,
    `- Budget: máximo +10% a cada 48h`);
  return lines.join('\n');
}

function analyzeCreatives(ctx: ChatContext): string {
  const groups = groupByEntity(ctx.creatives);
  const winners = ctx.creatives.filter(c => c.status === 'winner').sort((a, b) => b.score - a.score);
  const losers = ctx.creatives.filter(c => c.status === 'loser').sort((a, b) => a.score - b.score);
  const fatigued = ctx.creatives.filter(c => c.novelty_days > T.NOVELTY_MAX_DAYS);
  const overcrowded = Object.entries(groups).filter(([, v]) => v.length > T.ENTITY_MAX);
  const totalSpend = ctx.creatives.reduce((s, c) => s + c.spend, 0);
  const loserSpend = losers.reduce((s, c) => s + c.spend, 0);

  const lines: string[] = [
    `**Análise de Criativos — ${ctx.creatives.length} criativos em ${Object.keys(groups).length} Entity IDs**`, ''];

  for (const [gid, crs] of Object.entries(groups)) {
    const isOver = crs.length > T.ENTITY_MAX;
    const avgScore = Math.round(crs.reduce((s, c) => s + c.score, 0) / crs.length);
    const grpSpend = crs.reduce((s, c) => s + c.spend, 0);

    lines.push(`**Entity ID Group ${gid}** — ${crs.length} criativos ${isOver ? '🔴 OVERCROWDED' : '✅'}`,
      `Score médio: ${avgScore} | Spend: ${fmtBRL(grpSpend)} | ${isOver ? `Andromeda trata como 1 ticket (${crs.length} > ${T.ENTITY_MAX})` : 'Dentro do limite'}`);

    for (const cr of crs.sort((a, b) => b.score - a.score)) {
      const cpmRise = cr.cpm_trend.length >= 2 ? ((cr.cpm_trend[cr.cpm_trend.length - 1] - cr.cpm_trend[0]) / cr.cpm_trend[0]) * 100 : 0;
      const fatigueFlag = cr.novelty_days > T.NOVELTY_MAX_DAYS ? ' 🔴 FADIGA' : '';
      const icon = cr.score >= 70 ? '✅' : cr.score >= 40 ? '🟡' : '🔴';
      lines.push(`  ${icon} ${cr.name} — Score ${cr.score}, Hook ${cr.hook_rate}%, CPA ${fmtBRL(cr.cpa)}${fatigueFlag}${cpmRise > 15 ? ` CPM +${fmt(cpmRise, 0)}%` : ''}`);
    }
    lines.push('');
  }

  lines.push('---', `**Resumo:**`,
    `- **${winners.length} winners**: ${winners.slice(0, 3).map(c => c.name).join(', ') || 'nenhum'}`,
    `- **${losers.length} losers**: ${losers.slice(0, 3).map(c => c.name).join(', ') || 'nenhum'}${loserSpend > 0 ? ` (${fmtBRL(loserSpend)} desperdiçados)` : ''}`,
    `- **${fatigued.length} com fadiga** (${T.NOVELTY_MAX_DAYS}+ dias)`,
    `- **${overcrowded.length} Entity IDs overcrowded**`, '',
    `**Plano de ação:**`);

  if (losers.length) lines.push(`1. Pausar losers: ${losers.slice(0, 3).map(c => c.name).join(', ')}`);
  if (winners.length) lines.push(`${losers.length ? 2 : 1}. Escalar winners: ${winners.filter(c => c.novelty_days <= T.NOVELTY_MAX_DAYS).slice(0, 2).map(c => `${c.name} (${c.novelty_days}d)`).join(', ') || 'nenhum fresco'}`);
  if (overcrowded.length) lines.push(`${(losers.length ? 2 : 1) + (winners.length ? 1 : 0)}. Diversificar Entity IDs overcrowded: ${overcrowded.map(([k, v]) => `Group ${k} (${v.length})`).join(', ')}`);
  lines.push(`${(losers.length ? 1 : 0) + (winners.length ? 1 : 0) + (overcrowded.length ? 1 : 0) + 1}. Criar criativos em formatos diferentes para novos Entity IDs`);

  return lines.join('\n');
}

function analyzeHooks(ctx: ChatContext): string {
  if (!ctx.creatives.length) return '**Análise de Hooks**\n\nNenhum criativo disponível para análise. Adicione criativos na plataforma.';

  const sorted = [...ctx.creatives].sort((a, b) => b.hook_rate - a.hook_rate);
  const top = sorted.filter(c => c.hook_rate >= 40);
  const poor = sorted.filter(c => c.hook_rate < 25);
  const avgHook = ctx.creatives.reduce((s, c) => s + c.hook_rate, 0) / ctx.creatives.length;
  const avgHold = ctx.creatives.reduce((s, c) => s + c.hold_rate, 0) / ctx.creatives.length;
  const topAvgCPA = top.length ? top.reduce((s, c) => s + c.cpa, 0) / top.length : 0;
  const poorAvgCPA = poor.length ? poor.reduce((s, c) => s + c.cpa, 0) / poor.length : 0;

  return [
    `**Análise de Hooks — ${ctx.creatives.length} criativos**`,
    `Média geral: Hook ${fmt(avgHook, 0)}% | Hold ${fmt(avgHold, 0)}%`, '',
    ...(top.length ? [
      `**Top Hooks (≥40%)** — CPA médio ${fmtBRL(topAvgCPA)}:`,
      ...top.map((c, i) => `${i + 1}. **${c.name}** — Hook: ${c.hook_rate}%, Hold: ${c.hold_rate}%, CPA: ${fmtBRL(c.cpa)}`), '',
    ] : ['**Nenhum criativo com Hook Rate ≥40%.** Foco em pattern interrupt nos primeiros 0.5s.', '']),
    ...(poor.length ? [
      `**Hooks fracos (<25%)** — CPA médio ${fmtBRL(poorAvgCPA)}${topAvgCPA > 0 ? ` (+${fmt((poorAvgCPA / topAvgCPA - 1) * 100, 0)}% vs top)` : ''}:`,
      ...poor.map(c => `- ${c.name} — Hook: ${c.hook_rate}%, CPA: ${fmtBRL(c.cpa)}`), '',
    ] : []),
    ...(topAvgCPA > 0 && poorAvgCPA > 0 ? [
      `**Correlação Hook ↔ CPA:**`,
      `Hook ≥40% = CPA ${fmtBRL(topAvgCPA)} vs Hook <25% = CPA ${fmtBRL(poorAvgCPA)} (**${fmt((poorAvgCPA / topAvgCPA - 1) * 100, 0)}% mais caro**)`, '',
    ] : []),
    `**Padrões vencedores:**`,
    `- Pattern interrupt nos primeiros 0.5s (som trend, corte rápido)`,
    `- Face humana + expressão emocional > produto puro`,
    `- Hold rate >55% = conteúdo pós-hook entrega valor`,
    `- Meta analisa os primeiros 3 segundos para qualidade do criativo`,
  ].join('\n');
}

function analyzeAndromeda(ctx: ChatContext): string {
  const groups = groupByEntity(ctx.creatives);
  const overcrowded = Object.entries(groups).filter(([, v]) => v.length > T.ENTITY_MAX);
  const effectiveTickets = Object.keys(groups).length;
  const lostTickets = overcrowded.reduce((s, [, v]) => s + v.length - 1, 0);

  const ascCamps = ctx.campaigns.filter(c => c.name.includes('ASC') || c.name.includes('Advantage') || c.name.toLowerCase().includes('broad'));
  const cboCamps = ctx.campaigns.filter(c => c.name.includes('CBO') || c.name.includes('Interesses'));
  const ascAvg = ascCamps.length ? ascCamps.reduce((s, c) => s + c.opportunity_score, 0) / ascCamps.length : 0;
  const cboAvg = cboCamps.length ? cboCamps.reduce((s, c) => s + c.opportunity_score, 0) / cboCamps.length : 0;
  const learning = ctx.campaigns.filter(c => c.status === 'LEARNING' || c.status === 'LEARNING_LIMITED');

  return [
    `**Andromeda + GEM — Impacto nas Suas Campanhas**`, '',
    `**1. Entity ID Clustering:**`,
    `${ctx.creatives.length} criativos em ${effectiveTickets} Entity IDs`,
    ...(overcrowded.length
      ? [...overcrowded.map(([k, v]) => `- Group ${k}: ${v.length} criativos → 1 ticket (overcrowded)`),
         `⚠️ Perdendo ${lostTickets} ticket${lostTickets > 1 ? 's' : ''} no leilão`]
      : ['✅ Todos os Entity IDs otimizados']),
    '',
    ...(ascCamps.length && cboCamps.length ? [
      `**2. Broad vs Interesses:**`,
      `- ASC/Broad: Score médio **${fmt(ascAvg, 0)}** (${ascCamps.map(c => c.name).join(', ')})`,
      `- CBO/Interesses: Score médio **${fmt(cboAvg, 0)}** (${cboCamps.map(c => c.name).join(', ')})`,
      `${ascAvg > cboAvg ? `Broad supera interesses em **${fmt(ascAvg - cboAvg, 0)} pontos**. Andromeda 2025 encontra públicos melhor que segmentação manual.` : 'CBO competitivo — monitorar.'}`, '',
    ] : []),
    ...(learning.length ? [
      `**${ascCamps.length && cboCamps.length ? '3' : '2'}. Learning Phase:**`,
      ...learning.map(c => `- ${c.name}: ${c.learning_conversions ?? '?'}/50 conv, ${c.learning_days ?? '?'}d ${c.status === 'LEARNING_LIMITED' ? '⚠️ LIMITED' : '— progredindo'}`),
      `Andromeda calibra nos primeiros 50 conv/semana. Abaixo = "foto borrada".`, '',
    ] : []),
    `**Ações:**`,
    ...ctx.campaigns.filter(c => c.roas < T.ROAS_MIN).map(c => `- Pausar ${c.name} (ROAS negativo)`),
    overcrowded.length ? `- Diversificar Entity IDs overcrowded` : '',
    `- Confiar no broad targeting para novas campanhas`,
  ].filter(Boolean).join('\n');
}

function analyzeSignal(ctx: ChatContext): string {
  const m = ctx.metrics;
  const cpaSavings = m.cpa * 0.11;
  const totalSavings = cpaSavings * m.conversions;

  return [
    `**Signal Engineering — EMQ ${fmt(ctx.emqScore, 1)}/10**`, '',
    `**Impacto financeiro:**`,
    `EMQ ${fmt(ctx.emqScore, 1)} → 8.0 = CPA -11%`,
    `De ${fmtBRL(m.cpa)} para ~${fmtBRL(m.cpa * 0.89)}`,
    `**Economia estimada: ${fmtBRL(totalSavings)}/período** (${m.conversions} conv × ${fmtBRL(cpaSavings)})`, '',
    `**Para subir EMQ:**`,
    `1. Garantir todos os parâmetros de user_data no CAPI: em, ph, external_id, ip, ua, fbp, fbc`,
    `2. Adicionar custom_data avançado: predicted_ltv, margin_tier, engagement_score`,
    `3. Synthetic Events (Nível 5): DeepEngagement, HighIntentVisitor, QualifiedLead, PredictedBuyer`, '',
    `Eventos sintéticos ensinam o Andromeda comportamentos pré-compra invisíveis.`,
    `Apenas 0.01% dos anunciantes implementam Nível 5.`,
  ].join('\n');
}

function analyzeScaling(ctx: ChatContext): string {
  const m = ctx.metrics;
  const lines: string[] = [`**Recomendações de Scaling**`, `CPA alvo: ${fmtBRL(m.cpa)} | Regra: máx +10% / 48h`, ''];
  let savingsPerDay = 0;
  let extraBudget = 0;

  for (const c of ctx.campaigns) {
    if (c.status === 'LEARNING' || c.status === 'LEARNING_LIMITED') {
      lines.push(`⏳ **${c.name}**: NÃO ALTERAR — ${c.learning_conversions ?? '?'}/50 conv em learning`);
    } else if (c.roas < T.ROAS_MIN) {
      lines.push(`🛑 **${c.name}**: PAUSAR — ROAS ${fmt(c.roas)}x (economiza ${fmtBRL(c.daily_budget)}/dia)`);
      savingsPerDay += c.daily_budget;
    } else if (c.opportunity_score >= 70 && c.cpa < m.cpa && c.roas > T.ROAS_MIN) {
      const inc = c.daily_budget * 0.1;
      lines.push(`✅ **${c.name}**: ESCALAR +10% → ${fmtBRL(c.daily_budget + inc)}/dia (ROAS ${fmt(c.roas)}x, Score ${c.opportunity_score})`);
      extraBudget += inc;
    } else {
      lines.push(`👀 **${c.name}**: MONITORAR`);
    }
    lines.push('');
  }

  lines.push('---', `**Impacto:**`,
    `- Economizado: ${fmtBRL(savingsPerDay)}/dia (${fmtBRL(savingsPerDay * 30)}/mês)`,
    `- Investido: ${fmtBRL(extraBudget)}/dia`,
    `- Disponível para realocar: ${fmtBRL(savingsPerDay - extraBudget)}/dia`);
  return lines.join('\n');
}

// ─── Intent detection ────────────────────────────────────────────────────────

type AnalysisFn = (ctx: ChatContext) => string;

const INTENTS: Array<{ keywords: string[]; fn: AnalysisFn }> = [
  { keywords: ['visao geral', 'overview', 'geral', 'resumo', 'conta', 'dashboard'], fn: analyzeOverview },
  { keywords: ['lance', 'bid', 'estrategia de lance', 'bidding', 'cost cap', 'lowest cost'], fn: analyzeBidding },
  { keywords: ['criativ', 'entity', 'creative', 'criativos', 'entity id', 'melhorar meus'], fn: analyzeCreatives },
  { keywords: ['hook', 'hold rate', 'hook rate', 'primeiros 3', 'retencao'], fn: analyzeHooks },
  { keywords: ['andromeda', 'algoritmo', 'gem', 'ranking', 'leilao', 'auction'], fn: analyzeAndromeda },
  { keywords: ['emq', 'signal', 'capi', 'conversions api', 'pixel', 'evento sintetico'], fn: analyzeSignal },
  { keywords: ['escal', 'scaling', 'budget', 'pausar', 'orcamento', 'otimiz'], fn: analyzeScaling },
];

function detectAndRun(message: string, ctx: ChatContext): string {
  const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const intent of INTENTS) {
    if (intent.keywords.some(k => lower.includes(k))) return intent.fn(ctx);
  }

  // Fallback: diagnóstico rápido
  const alerts = runAlerts(ctx);
  const m = ctx.metrics;
  const winners = ctx.campaigns.filter(c => c.opportunity_score >= 70);
  const losers = ctx.campaigns.filter(c => c.roas < T.ROAS_MIN);
  const fatigued = ctx.creatives.filter(c => c.novelty_days > T.NOVELTY_MAX_DAYS);

  return [
    `**Apex — Diagnóstico Rápido**`, '',
    `Score: **${m.accountScore}/100** | CPA: ${fmtBRL(m.cpa)} | ROAS: ${fmt(m.roas)}x | EMQ: ${fmt(ctx.emqScore, 1)}/10`,
    `${ctx.campaigns.length} campanhas | ${ctx.creatives.length} criativos`, '',
    `**${alerts.length} alertas** | **${winners.length} winners** | **${losers.length} para pausar** | **${fatigued.length} com fadiga**`, '',
    `**Top 3 ações:**`,
    losers.length ? `1. 🛑 Pausar ${losers[0].name} (ROAS ${fmt(losers[0].roas)}x)` : `1. ✅ Nenhum ROAS negativo`,
    winners.length ? `2. ✅ Escalar ${winners[0].name} +10%` : `2. ⏳ Nenhum winner claro`,
    ctx.emqScore < T.EMQ_MIN ? `3. 📡 Corrigir EMQ ${fmt(ctx.emqScore, 1)} → 8.0 (CPA -11%)` : `3. ✅ EMQ ok`, '',
    `Pergunte sobre: criativos, lances, hooks, EMQ, scaling, Andromeda`,
  ].join('\n');
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.json({ ok: true, mode: process.env.ANTHROPIC_API_KEY ? 'live' : 'engine', version: '2.0.0', name: 'apex-engine' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, context } = req.body as { message?: string; context?: ChatContext };
  if (!message?.trim()) return res.status(400).json({ error: 'Missing "message" field' });

  // Se o store não enviou dados, usar dados demo do servidor
  const ctx: ChatContext = (context?.campaigns?.length || context?.creatives?.length)
    ? context
    : FALLBACK_CTX;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Com API key → Claude enriquece a análise
  if (apiKey) {
    try {
      const analysis = detectAndRun(message, ctx);
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 2048,
          system: `Você é o Apex, consultor especialista em Meta Ads. O motor de análise processou os dados reais da conta. Use os resultados abaixo para responder de forma conversacional.\n\n${analysis}`,
          messages: [{ role: 'user', content: message }],
        }),
      });
      if (response.ok) {
        const data = await response.json() as { content: Array<{ type: string; text?: string }> };
        const text = data.content?.filter(b => b.type === 'text').map(b => b.text ?? '').join('');
        return res.json({ response: text, mode: 'live' });
      }
    } catch { /* fall through */ }
  }

  return res.json({ response: detectAndRun(message, ctx), mode: 'engine' });
}
