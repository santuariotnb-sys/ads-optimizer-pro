import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/apex/chat
 *
 * Serverless function que conecta o Apex ao Claude API.
 * A ANTHROPIC_API_KEY fica como env var na Vercel (segura).
 *
 * Body: { message: string, context?: { cpa, roas, ctr, cpm, spend, conversions, accountScore, emqScore } }
 * Response: { response: string, mode: 'live' | 'demo' }
 */

// ─── Demo data (fallback sem API key) ────────────────────────────────────────

const DEMO = {
  metrics: { cpa: 52.4, roas: 3.24, ctr: 2.15, cpm: 33.8, spend: 37970, conversions: 650, accountScore: 74 },
  emq: 6.8,
  activeCampaigns: 4,
  creatives: { total: 11, winners: 5, losers: 5, entityGroups: 5 },
};

function getDemoResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('visao geral') || lower.includes('overview') || lower.includes('geral')) {
    return `**Análise Geral da Conta**

Score: 74/100 (Bom). CPA R$ 52,40, ROAS 3.24x.

**Pontos Positivos:**
- [ASC] Protocolo Detox é uma estrela com ROAS 3.82x e Opportunity Score 87
- [RETARGET] Carrinho Abandonado entrega ROAS 5.21x

**Pontos de Atenção:**
- [CBO] Colágeno Premium operando com ROAS 0.82 (negativo) — pausar imediatamente
- [ASC] Black Friday em Learning Limited há 18 dias (35/50 conversões)
- EMQ está em 6.8, abaixo do ideal (8.0+) — aumentando CPA em ~11%

**Ação Imediata:** Pausar Colágeno Premium, escalar Protocolo Detox +10%, corrigir CAPI para subir EMQ.`;
  }

  if (lower.includes('lance') || lower.includes('bid') || lower.includes('estrategia')) {
    return `**Estratégia de Lances Recomendada**

**Campanhas de Performance (Detox, Skincare):**
Manter LOWEST_COST_WITHOUT_CAP. Com CPA de R$ 42,50 e R$ 58,30, o algoritmo está encontrando bons clusters.

**Retargeting (Carrinho Abandonado):**
ROAS 5.21x — considere COST_CAP com cap em R$ 35. Frequência de 3.2 indica saturação — expandir janela de 7d para 14d.

**Campanhas em Learning (Whey):**
NUNCA altere o bid strategy em learning phase. O Andromeda precisa de estabilidade. Espere 50 conversões/semana.

**Advantage+ Sales:**
Broad targeting está correto. GEM entrega +5% conversões no Instagram — otimize criativos para IG Reels.`;
  }

  if (lower.includes('criativ') || lower.includes('entity')) {
    return `**Análise de Criativos + Entity IDs**

11 criativos em 5 Entity IDs.

**Entity ID Group B (Statics) — SUPERLOTADO:**
5 criativos com similaridade visual >60%. Andromeda usa apenas 1 ticket no leilão para todos.

**Winners para Escalar:**
- "Reels — Trend Sound Detox" (Score 96): Hook Rate 48%, CPA R$ 32
- "UGC — Influencer Detox" (Score 95): Hook Rate 45%, Hold Rate 62%
- "UGC — Resultados 30 dias" (Score 93): Novíssimo (2 dias)

**Losers para Pausar:**
- "Carrossel — 5 Produtos Top" (Score 22): CTR 0.8%, CPA R$ 120
- "Static — Comparativo Preço" (Score 18): CTR 0.7%, 13 dias ativo

**Recomendação:** Criar 3 novos criativos em formatos diferentes (UGC testemunho, Reels trend, Motion 3D) para novos Entity IDs.`;
  }

  if (lower.includes('hook')) {
    return `**Análise de Hooks**

**Top Hooks (>40% Hook Rate):**
1. "Reels — Trend Sound" (48%): Música trend + corte rápido nos primeiros 0.5s
2. "UGC — Influencer Detox" (45%): Pessoa real + expressão de surpresa
3. "UGC — Resultados 30 dias" (43%): Antes/depois com transição rápida
4. "VSL Detox — Hook Curiosidade" (42%): Pergunta provocativa nos primeiros 2s

**Padrão dos Winners:** Todos usam os primeiros 0.5-1s para pattern interrupt. Hold Rate >55% indica conteúdo pós-hook entrega valor.

**Hooks que Falham (<25%):**
- Carrosséis: hook rate médio de 18%
- Statics sem face humana: abaixo de 25%

**Meta analisa os primeiros 3 segundos para qualidade do criativo. Hook fraco = CPM mais alto.**`;
  }

  if (lower.includes('andromeda') || lower.includes('algoritmo')) {
    return `**Como o Andromeda Está Afetando Suas Campanhas**

O Andromeda filtra bilhões de ads para ~1.000 candidatos em <200ms.

**Na sua conta:**
1. **Entity ID Clustering:** 11 criativos em 5 Entity IDs. Group B (statics) superlotado — efetivamente 4 tickets no leilão, não 5
2. **GEM Ranking:** UGCs performam melhor no IG (+5% conv), VSLs no FB Feed (+3%)
3. **Broad vs Interesses:** Campanha Broad (Detox, Score 87) supera Interesses (Colágeno, Score 28) por margem enorme
4. **Learning Phase:** Whey (8d, 22/50 conv) precisa de mais volume

**Ação:** Matar campanha de interesses, diversificar Entity IDs, confiar no broad targeting. O Andromeda 2025 é melhor que segmentação manual.`;
  }

  if (lower.includes('emq') || lower.includes('signal') || lower.includes('capi')) {
    return `**Signal Engineering — EMQ 6.8/10**

Nível 2 (CAPI básico). 90% dos anunciantes estão aqui.

**Breakdown:**
- Email: 2.0/2.0 ✅
- Phone: 1.5/1.5 ✅
- External ID: 1.5/1.5 ✅
- IP + User Agent: 1.0/1.0 ✅
- FBP: 0.5/0.5 ✅
- FBC: 0.3/0.5 ⚠️ — perdendo 0.2

**Para Nível 4 (EMQ 8.5+):**
Adicionar no custom_data do CAPI: predicted_ltv, margin_tier, engagement_score.

**Impacto:** EMQ 6.8→8.4 = CPA -11% = economia de ~R$ 5.057/semana.

**Synthetic Events (Nível 5 — 0.01% dos anunciantes):**
DeepEngagement (scroll 75% + 2min) e HighIntentVisitor (3 visitas em 48h) via CAPI.`;
  }

  return `**Análise Personalizada**

Com base nos dados da conta (CPA R$ ${DEMO.metrics.cpa}, ROAS ${DEMO.metrics.roas}x, EMQ ${DEMO.emq}):

- CPA pode ser otimizado em até 15% com ajustes no Signal Engineering
- Criativos UGC apresentam Hook Rate 45%+ versus statics com apenas 18%
- O Andromeda favorece broad targeting — campanhas sem segmentação manual performam 3.2x melhor
- EMQ abaixo do ideal (6.8 vs 8.0) está custando ~11% a mais no CPA
- Entity ID Group B está superlotado — Andromeda trata 5 criativos como 1 ticket

Selecione um tópico específico para análise detalhada ou faça uma pergunta direta.`;
}

// ─── System prompt ───────────────────────────────────────────────────────────

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

function buildSystemPrompt(context?: ChatContext): string {
  const m = DEMO.metrics;
  const cpa = context?.cpa ?? m.cpa;
  const roas = context?.roas ?? m.roas;
  const ctr = context?.ctr ?? m.ctr;
  const cpm = context?.cpm ?? m.cpm;
  const spend = context?.spend ?? m.spend;
  const conversions = context?.conversions ?? m.conversions;
  const accountScore = context?.accountScore ?? m.accountScore;
  const emqScore = context?.emqScore ?? DEMO.emq;

  return `Você é o Apex, um consultor especialista em Meta Ads (Facebook/Instagram) com conhecimento profundo sobre:
- Andromeda (retrieval engine), GEM (ranking model), Entity ID clustering
- Signal Engineering e CAPI (Conversions API) — Níveis 1-5, EMQ scoring, synthetic events
- Otimização de criativos, hooks (3s), hold rate, novelty bias (7 dias)
- Estratégias de lance: Lowest Cost, Cost Cap, Bid Cap, ROAS target
- Auto-scaling: regra 10%/48h, mínimo 7 dias, 50 conv/semana target

Regras de ouro:
1. Broad targeting > Interesses manuais (Andromeda 2025+)
2. Entity IDs únicos = mais tickets no leilão
3. EMQ 8.0+ = CPA -11% vs EMQ 6.8
4. Novelty bias: criativos perdem força após 7 dias
5. Learning phase: NUNCA alterar antes de 50 conv/semana
6. Budget: máximo +10% a cada 48h

Dados atuais da conta:
- CPA: R$ ${cpa.toFixed(2)} | ROAS: ${roas.toFixed(2)}x | CTR: ${ctr.toFixed(2)}%
- CPM: R$ ${cpm.toFixed(2)} | Investimento: R$ ${spend.toLocaleString('pt-BR')}
- Conversões: ${conversions} | Score: ${accountScore}/100 | EMQ: ${emqScore}/10
- Campanhas ativas: ${DEMO.activeCampaigns}
- Criativos: ${DEMO.creatives.total} (${DEMO.creatives.winners} winners, ${DEMO.creatives.losers} losers)
- Entity IDs: ${DEMO.creatives.entityGroups} grupos

Campanhas principais:
- [ASC] Protocolo Detox: ROAS 3.82x, CPA R$42.50, Score 87 — WINNER
- [ASC] Skincare Premium: ROAS 2.91x, CPA R$58.30, Score 72
- [CBO] Colágeno Premium: ROAS 0.82x, CPA R$124 — PAUSAR
- [RETARGET] Carrinho Abandonado: ROAS 5.21x, CPA R$28.90, Score 91 — WINNER
- [ASC] Black Friday: LEARNING_LIMITED 18 dias, 35/50 conv
- [CBO] Whey Isolado: LEARNING 8 dias, 22/50 conv

Responda sempre em português brasileiro. Seja direto, prático e baseado em dados.
Use métricas reais. Dê ações específicas com impacto estimado.`;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Health check via GET
  if (req.method === 'GET') {
    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    return res.json({
      ok: true,
      mode: hasKey ? 'live' : 'demo',
      version: '1.0.0',
      name: 'apex-serverless',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context } = req.body as { message?: string; context?: ChatContext };

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Missing "message" field' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Sem API key → resposta demo inteligente
  if (!apiKey) {
    return res.json({ response: getDemoResponse(message), mode: 'demo' });
  }

  // Com API key → Claude API real
  try {
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
        system: buildSystemPrompt(context),
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: `Claude API error: ${response.status}`,
        details: errorData,
        mode: 'error',
      });
    }

    const data = await response.json() as { content: Array<{ type: string; text?: string }> };
    const text = data.content
      ?.filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('');

    return res.json({ response: text, mode: 'live' });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMessage, mode: 'error' });
  }
}
