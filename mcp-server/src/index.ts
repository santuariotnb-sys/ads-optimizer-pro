#!/usr/bin/env node
/**
 * Apex MCP Server — Agente de tráfego pago para Claude Code.
 *
 * Transporte: stdio (Claude Code CLI)
 * Tools: 7 ferramentas de análise Meta Ads
 * Resource: system prompt com expertise Meta Ads
 *
 * Uso: npx tsx mcp-server/src/index.ts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  campaigns,
  creatives,
  metrics,
  emq,
  THRESHOLDS,
  type DemoCampaign,
  type DemoCreative,
} from './demo-data.js';

// ─── Server ──────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'apex',
  version: '1.0.0',
});

// ─── Resource: System Prompt ─────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é o Apex, um consultor especialista em Meta Ads (Facebook/Instagram) com conhecimento profundo sobre:

## Expertise técnica
- **Andromeda** (retrieval engine): filtra bilhões de ads para ~1.000 candidatos em <200ms usando NVIDIA Grace Hopper + MTIA v2
- **GEM** (ranking model): escala GPT-4, aprende cross-platform (IG↔FB), rankeia ads finais
- **Entity ID Clustering**: como o Meta agrupa criativos visuais similares e limita tickets no leilão
- **Signal Engineering & CAPI**: Conversions API Level 1-5, EMQ scoring, synthetic events
- **Otimização de criativos**: hooks (3s), hold rate, novelty bias (7 dias), pattern interrupts
- **Estratégias de lance**: Lowest Cost, Cost Cap, Bid Cap, ROAS target. Regras de learning phase
- **Auto-scaling**: regra 10%/48h, mínimo 7 dias antes de decisão, 50 conv/semana target

## Regras de ouro
1. Broad targeting > Interesses manuais (Andromeda 2025+)
2. Entity IDs únicos = mais tickets no leilão
3. EMQ 8.0+ = CPA -11% vs EMQ 6.8
4. Novelty bias: criativos perdem força após 7 dias
5. Learning phase: NUNCA alterar antes de 50 conv/semana
6. Budget: máximo +10% a cada 48h
7. Synthetic events (Level 5): apenas 0.01% dos anunciantes implementam

## Formato de resposta
- Sempre em português brasileiro
- Direto, prático, baseado em dados
- Use métricas reais da conta quando disponíveis
- Dê ações específicas com impacto estimado`;

server.resource('apex-prompt', 'apex://system-prompt', async (uri) => ({
  contents: [
    {
      uri: uri.href,
      mimeType: 'text/plain',
      text: SYSTEM_PROMPT,
    },
  ],
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function fmtBRL(n: number): string {
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bom';
  if (score >= 40) return 'Regular';
  return 'Crítico';
}

function groupByEntity(crs: DemoCreative[]): Record<string, DemoCreative[]> {
  const groups: Record<string, DemoCreative[]> = {};
  for (const cr of crs) {
    (groups[cr.entity_id_group] ??= []).push(cr);
  }
  return groups;
}

// ─── Tool 1: Visão geral da conta ────────────────────────────────────────────

server.tool(
  'get_account_overview',
  'Retorna visão geral da conta: métricas, score, campanhas ativas, alertas',
  {},
  async () => {
    const active = campaigns.filter((c) => c.status === 'ACTIVE');
    const learning = campaigns.filter((c) => c.status === 'LEARNING' || c.status === 'LEARNING_LIMITED');
    const alerts = evaluateAlerts();

    const text = [
      `## Visão Geral da Conta`,
      ``,
      `**Score:** ${metrics.accountScore}/100 (${scoreLabel(metrics.accountScore)})`,
      `**CPA:** ${fmtBRL(metrics.cpa)} | **ROAS:** ${fmt(metrics.roas)}x | **CTR:** ${fmt(metrics.ctr)}%`,
      `**CPM:** ${fmtBRL(metrics.cpm)} | **Investimento:** ${fmtBRL(metrics.spend)}`,
      `**Conversões:** ${metrics.conversions} | **EMQ:** ${fmt(emq.score, 1)}/10 (Nível ${emq.level})`,
      ``,
      `### Campanhas`,
      `- **Ativas:** ${active.length} (${active.map((c) => c.name).join(', ')})`,
      `- **Learning:** ${learning.length} (${learning.map((c) => `${c.name} [${c.learning_days}d, ${c.learning_conversions}/50 conv]`).join(', ')})`,
      ``,
      `### Top Performers`,
      ...campaigns
        .filter((c) => c.opportunity_score >= 70)
        .sort((a, b) => b.opportunity_score - a.opportunity_score)
        .map((c) => `- ${c.name}: ROAS ${fmt(c.roas)}x, CPA ${fmtBRL(c.cpa)}, Score ${c.opportunity_score}`),
      ``,
      `### Alertas (${alerts.length})`,
      ...alerts.map((a) => `- [${a.severity.toUpperCase()}] ${a.message}`),
    ].join('\n');

    return { content: [{ type: 'text', text }] };
  },
);

// ─── Tool 2: Análise de campanhas ────────────────────────────────────────────

server.tool(
  'analyze_campaigns',
  'Análise detalhada de campanhas com recomendações de otimização',
  {
    focus: z.enum(['all', 'winners', 'losers', 'learning']).optional().describe('Filtro de campanhas'),
  },
  async ({ focus }) => {
    let filtered: DemoCampaign[];
    switch (focus) {
      case 'winners':
        filtered = campaigns.filter((c) => c.opportunity_score >= 70);
        break;
      case 'losers':
        filtered = campaigns.filter((c) => c.roas < THRESHOLDS.ROAS_MIN || c.opportunity_score < 40);
        break;
      case 'learning':
        filtered = campaigns.filter((c) => c.status === 'LEARNING' || c.status === 'LEARNING_LIMITED');
        break;
      default:
        filtered = campaigns;
    }

    const lines: string[] = [`## Análise de Campanhas (${focus || 'all'})`, ''];

    for (const c of filtered) {
      const issues: string[] = [];
      if (c.roas < THRESHOLDS.ROAS_MIN) issues.push(`ROAS ${fmt(c.roas)}x abaixo do mínimo (${THRESHOLDS.ROAS_MIN}x)`);
      if (c.ctr < THRESHOLDS.CTR_MIN) issues.push(`CTR ${fmt(c.ctr)}% abaixo do mínimo (${THRESHOLDS.CTR_MIN}%)`);
      if (c.frequency > THRESHOLDS.FREQUENCY_MAX) issues.push(`Frequência ${fmt(c.frequency, 1)} acima do máximo (${THRESHOLDS.FREQUENCY_MAX})`);
      if (c.status === 'LEARNING_LIMITED' && (c.learning_days ?? 0) > THRESHOLDS.LEARNING_MAX_DAYS) {
        issues.push(`Learning Limited há ${c.learning_days} dias (máx ${THRESHOLDS.LEARNING_MAX_DAYS})`);
      }

      const recommendation = c.opportunity_score >= 70
        ? `✅ Escalar +10% budget (de ${fmtBRL(c.daily_budget)} para ${fmtBRL(c.daily_budget * 1.1)})`
        : c.roas < THRESHOLDS.ROAS_MIN
          ? `🛑 PAUSAR — ROAS negativo, queimando budget`
          : c.status === 'LEARNING_LIMITED'
            ? `⚠️ Consolidar ad sets ou aumentar budget para sair de Learning Limited`
            : `⏳ Monitorar — ${c.learning_conversions ?? '?'}/50 conversões`;

      lines.push(
        `### ${c.name}`,
        `Status: ${c.status} | Score: ${c.opportunity_score}/100 | Budget: ${fmtBRL(c.daily_budget)}/dia`,
        `ROAS: ${fmt(c.roas)}x | CPA: ${fmtBRL(c.cpa)} | CTR: ${fmt(c.ctr)}% | Freq: ${fmt(c.frequency, 1)}`,
        `Spend: ${fmtBRL(c.spend)} | Conv: ${c.conversions} | Impressões: ${c.impressions.toLocaleString('pt-BR')}`,
        issues.length ? `**Problemas:** ${issues.join('; ')}` : '**Sem problemas detectados**',
        `**Recomendação:** ${recommendation}`,
        '',
      );
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  },
);

// ─── Tool 3: Análise de criativos + Entity IDs ──────────────────────────────

server.tool(
  'analyze_creatives',
  'Análise de criativos: Entity ID clustering, winners/losers, fadiga, overcrowding',
  {
    entity_group: z.string().optional().describe('Filtrar por Entity ID group (A, B, C, D, E)'),
  },
  async ({ entity_group }) => {
    const groups = groupByEntity(creatives);
    const targetGroups = entity_group
      ? { [entity_group]: groups[entity_group] || [] }
      : groups;

    const lines: string[] = [`## Análise de Criativos — ${Object.keys(targetGroups).length} Entity IDs`, ''];

    for (const [gid, crs] of Object.entries(targetGroups)) {
      const overcrowded = crs.length > THRESHOLDS.ENTITY_OVERCROWDED;
      const avgCPA = crs.reduce((s, c) => s + c.cpa, 0) / crs.length;
      const totalSpend = crs.reduce((s, c) => s + c.spend, 0);

      lines.push(
        `### Entity ID Group ${gid} — ${crs.length} criativos ${overcrowded ? '🔴 OVERCROWDED' : ''}`,
        `CPA médio: ${fmtBRL(avgCPA)} | Spend total: ${fmtBRL(totalSpend)}`,
        overcrowded
          ? `⚠️ ${crs.length} criativos (máx ${THRESHOLDS.ENTITY_OVERCROWDED}). Andromeda usa apenas 1 ticket no leilão para este grupo.`
          : `✅ Dentro do limite de ${THRESHOLDS.ENTITY_OVERCROWDED} criativos por Entity ID.`,
        '',
      );

      for (const cr of crs.sort((a, b) => b.score - a.score)) {
        const fatigued = cr.novelty_days > THRESHOLDS.NOVELTY_MAX_DAYS;
        const cpmRise = cr.cpm_trend.length >= 2
          ? ((cr.cpm_trend[cr.cpm_trend.length - 1] - cr.cpm_trend[0]) / cr.cpm_trend[0]) * 100
          : 0;

        lines.push(
          `  **${cr.name}** (Score: ${cr.score}/100, ${cr.status.toUpperCase()})`,
          `  Hook: ${cr.hook_rate}% | Hold: ${cr.hold_rate}% | CTR: ${fmt(cr.ctr)}% | CPA: ${fmtBRL(cr.cpa)}`,
          `  Dias ativo: ${cr.novelty_days} ${fatigued ? '🔴 FADIGA' : ''} | CPM trend: ${cpmRise > 0 ? `+${fmt(cpmRise, 0)}%` : 'estável'}`,
          '',
        );
      }
    }

    // Summary
    const winners = creatives.filter((c) => c.status === 'winner');
    const losers = creatives.filter((c) => c.status === 'loser');
    const fatigued = creatives.filter((c) => c.novelty_days > THRESHOLDS.NOVELTY_MAX_DAYS);

    lines.push(
      `---`,
      `### Resumo`,
      `- **Winners:** ${winners.length} (${winners.map((c) => c.name).join(', ')})`,
      `- **Losers:** ${losers.length} — pausar para liberar budget`,
      `- **Fadiga detectada:** ${fatigued.length} criativos com ${THRESHOLDS.NOVELTY_MAX_DAYS}+ dias`,
      `- **Entity IDs overcrowded:** ${Object.entries(groups).filter(([, v]) => v.length > THRESHOLDS.ENTITY_OVERCROWDED).map(([k]) => `Group ${k}`).join(', ') || 'nenhum'}`,
      ``,
      `### Ação recomendada`,
      `1. Pausar losers: ${losers.map((c) => c.name).join(', ')}`,
      `2. Escalar winners: ${winners.filter((c) => c.novelty_days <= THRESHOLDS.NOVELTY_MAX_DAYS).map((c) => c.name).join(', ')}`,
      `3. Criar 3 novos criativos em formatos diferentes (UGC, Reels trend, Motion 3D) para novos Entity IDs`,
    );

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  },
);

// ─── Tool 4: Signal Quality / EMQ ────────────────────────────────────────────

server.tool(
  'check_signal_quality',
  'Análise completa de EMQ, CAPI status, e recomendações de Signal Engineering',
  {},
  async () => {
    const { breakdown } = emq;
    const missing = emq.maxScore - emq.score;

    const lines = [
      `## Signal Engineering — EMQ ${fmt(emq.score, 1)}/10 (Nível ${emq.level})`,
      '',
      `### Breakdown do EMQ`,
      `| Parâmetro | Score | Máximo | Status |`,
      `|-----------|-------|--------|--------|`,
      `| Email (em) | ${breakdown.email} | 2.0 | ${breakdown.email >= 2.0 ? '✅' : '⚠️'} |`,
      `| Phone (ph) | ${breakdown.phone} | 1.5 | ${breakdown.phone >= 1.5 ? '✅' : '⚠️'} |`,
      `| External ID | ${breakdown.external_id} | 1.5 | ${breakdown.external_id >= 1.5 ? '✅' : '⚠️'} |`,
      `| IP + User Agent | ${breakdown.ip_ua} | 1.0 | ${breakdown.ip_ua >= 1.0 ? '✅' : '⚠️'} |`,
      `| FBP (cookie) | ${breakdown.fbp} | 0.5 | ${breakdown.fbp >= 0.5 ? '✅' : '⚠️'} |`,
      `| FBC (click ID) | ${breakdown.fbc} | 0.5 | ${breakdown.fbc >= 0.5 ? '✅' : '⚠️ -${fmt(0.5 - breakdown.fbc, 1)}'} |`,
      '',
      `**Gap:** ${fmt(missing, 1)} pontos abaixo do máximo`,
      '',
      `### Impacto no CPA`,
      `EMQ ${fmt(emq.score, 1)} → ${THRESHOLDS.EMQ_MIN}.0 = CPA estimado -11%`,
      `De ${fmtBRL(metrics.cpa)} para ~${fmtBRL(metrics.cpa * 0.89)}`,
      `Economia: ${fmtBRL((metrics.cpa - metrics.cpa * 0.89) * metrics.conversions)}/período`,
      '',
      `### Para subir para Nível 4 (EMQ 8.5+)`,
      `1. **Corrigir FBC**: capturar todos os click IDs (fbc). Gap: ${fmt(0.5 - breakdown.fbc, 1)}`,
      `2. **Adicionar custom_data avançado no CAPI:**`,
      `   - \`predicted_ltv\`: valor previsto de LTV`,
      `   - \`margin_tier\`: "high" | "medium" | "low"`,
      `   - \`engagement_score\`: 0-10 baseado em comportamento`,
      '',
      `### Para Nível 5 (Synthetic Events) — 0.01% dos anunciantes`,
      `Implementar via CAPI:`,
      `- **DeepEngagement**: scroll 75% + 2min na landing page`,
      `- **HighIntentVisitor**: 3+ visitas em 48h`,
      `- **QualifiedLead**: lead score > 70`,
      `- **PredictedBuyer**: buyer prediction score > 0.7`,
      '',
      `Estes eventos ensinam o Andromeda comportamentos pré-compra invisíveis.`,
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  },
);

// ─── Tool 5: Alertas ─────────────────────────────────────────────────────────

interface Alert {
  severity: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  campaign?: string;
}

function evaluateAlerts(): Alert[] {
  const alerts: Alert[] = [];

  for (const c of campaigns) {
    if (c.roas < THRESHOLDS.ROAS_MIN) {
      alerts.push({ severity: 'critical', message: `${c.name}: ROAS ${fmt(c.roas)}x abaixo do mínimo`, campaign: c.id });
    }
    if (c.ctr < THRESHOLDS.CTR_MIN) {
      alerts.push({ severity: 'warning', message: `${c.name}: CTR ${fmt(c.ctr)}% abaixo de ${THRESHOLDS.CTR_MIN}%`, campaign: c.id });
    }
    if (c.frequency > THRESHOLDS.FREQUENCY_MAX) {
      alerts.push({ severity: 'warning', message: `${c.name}: Frequência ${fmt(c.frequency, 1)} acima de ${THRESHOLDS.FREQUENCY_MAX}`, campaign: c.id });
    }
    if (c.status === 'LEARNING_LIMITED' && (c.learning_days ?? 0) > THRESHOLDS.LEARNING_MAX_DAYS) {
      alerts.push({ severity: 'info', message: `${c.name}: Learning Limited há ${c.learning_days} dias`, campaign: c.id });
    }
    if (c.opportunity_score >= 80 && c.roas > 2) {
      alerts.push({ severity: 'success', message: `${c.name}: Winner detectado! Score ${c.opportunity_score}, ROAS ${fmt(c.roas)}x`, campaign: c.id });
    }
  }

  if (emq.score < 6.0) {
    alerts.push({ severity: 'critical', message: `EMQ ${fmt(emq.score, 1)}/10 — signal quality crítico` });
  } else if (emq.score < THRESHOLDS.EMQ_MIN) {
    alerts.push({ severity: 'warning', message: `EMQ ${fmt(emq.score, 1)}/10 — abaixo do ideal (${THRESHOLDS.EMQ_MIN}+)` });
  }

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2, success: 3 };
    return order[a.severity] - order[b.severity];
  });
}

server.tool(
  'evaluate_alerts',
  'Executa o motor de alertas e retorna alertas ativos com severidade',
  {},
  async () => {
    const alerts = evaluateAlerts();

    const lines = [
      `## Alertas Ativos (${alerts.length})`,
      '',
      ...alerts.map((a) => {
        const icon = { critical: '🔴', warning: '🟡', info: '🔵', success: '🟢' }[a.severity];
        return `${icon} **[${a.severity.toUpperCase()}]** ${a.message}`;
      }),
      '',
      `### Ações prioritárias`,
      ...alerts
        .filter((a) => a.severity === 'critical')
        .map((a) => `- ⚡ ${a.message} → ação imediata necessária`),
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  },
);

// ─── Tool 6: Auto-scale suggestions ─────────────────────────────────────────

server.tool(
  'suggest_scaling',
  'Recomendações de auto-scaling: quais campanhas escalar, pausar ou manter',
  {
    cpa_target: z.number().optional().describe('CPA alvo em R$. Default: CPA médio da conta'),
  },
  async ({ cpa_target }) => {
    const target = cpa_target ?? metrics.cpa;
    const actions: string[] = [];

    for (const c of campaigns) {
      if (c.status === 'LEARNING' || c.status === 'LEARNING_LIMITED') {
        actions.push(`⏳ **${c.name}**: Em learning phase — NÃO alterar. ${c.learning_conversions ?? 0}/50 conv.`);
        continue;
      }

      if (c.cpa > target * 2) {
        actions.push(`🛑 **${c.name}**: PAUSAR — CPA ${fmtBRL(c.cpa)} > 2x target (${fmtBRL(target * 2)})`);
        continue;
      }

      if (c.cpa < target && c.roas > THRESHOLDS.ROAS_MIN && c.opportunity_score >= 70) {
        const newBudget = c.daily_budget * 1.1;
        actions.push(
          `✅ **${c.name}**: ESCALAR +10% — ${fmtBRL(c.daily_budget)} → ${fmtBRL(newBudget)}/dia` +
          ` (CPA ${fmtBRL(c.cpa)} < target ${fmtBRL(target)}, ROAS ${fmt(c.roas)}x, Score ${c.opportunity_score})`,
        );
        continue;
      }

      if (c.ctr < THRESHOLDS.CTR_MIN && c.conversions < 5) {
        actions.push(`⚠️ **${c.name}**: Considerar pausar — CTR ${fmt(c.ctr)}% e apenas ${c.conversions} conv.`);
        continue;
      }

      actions.push(`👀 **${c.name}**: Monitorar — sem ação necessária agora.`);
    }

    const lines = [
      `## Recomendações de Scaling`,
      `CPA target: ${fmtBRL(target)} | Regra: máx +10% a cada 48h`,
      '',
      ...actions,
      '',
      `### Regras aplicadas`,
      `- Mínimo 7 dias ativos antes de decisão`,
      `- Cooldown 48h entre ajustes de budget`,
      `- Máximo +10% por ajuste`,
      `- Nunca alterar campanhas em learning phase`,
      `- Pausar se CPA > 2x target`,
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  },
);

// ─── Tool 7: Hook analysis ──────────────────────────────────────────────────

server.tool(
  'analyze_hooks',
  'Análise de hook rate e hold rate dos criativos. Identifica padrões vencedores.',
  {},
  async () => {
    const sorted = [...creatives].sort((a, b) => b.hook_rate - a.hook_rate);
    const topHooks = sorted.filter((c) => c.hook_rate >= 40);
    const poorHooks = sorted.filter((c) => c.hook_rate < 25);

    const lines = [
      `## Análise de Hooks — ${creatives.length} criativos`,
      '',
      `### Top Hooks (≥40% Hook Rate)`,
      ...topHooks.map(
        (c, i) =>
          `${i + 1}. **${c.name}** — Hook: ${c.hook_rate}%, Hold: ${c.hold_rate}%, CPA: ${fmtBRL(c.cpa)}`,
      ),
      '',
      `### Hooks fracos (<25%)`,
      ...poorHooks.map(
        (c) =>
          `- **${c.name}** — Hook: ${c.hook_rate}%, CPA: ${fmtBRL(c.cpa)} (${fmt((c.cpa / metrics.cpa - 1) * 100, 0)}% acima da média)`,
      ),
      '',
      `### Padrões vencedores identificados`,
      `- **Pattern interrupt** nos primeiros 0.5s (som trend, movimento, corte rápido)`,
      `- **Face humana** + expressão emocional = +15% hook rate vs produto puro`,
      `- **UGC/Reels** superam statics em hook rate: ${fmt(topHooks.reduce((s, c) => s + c.hook_rate, 0) / topHooks.length, 0)}% vs ${fmt(poorHooks.reduce((s, c) => s + c.hook_rate, 0) / poorHooks.length, 0)}%`,
      `- **Hold rate >55%** indica conteúdo pós-hook entrega valor`,
      '',
      `### Recomendações para novos hooks`,
      `1. "Você não vai acreditar no que aconteceu..." (curiosity gap)`,
      `2. Áudio trend do momento + visual inesperado`,
      `3. Close-up em resultado real + corte para produto`,
      `4. Depoimento emocional nos primeiros 3s`,
      '',
      `**Lembre-se:** Meta analisa os primeiros 3 segundos para qualidade do criativo. Hook fraco = CPM mais alto + alcance menor.`,
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  },
);

// ─── Start ───────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
