#!/usr/bin/env node
/**
 * HTTP Bridge — Servidor local para o React app se comunicar com o Apex.
 *
 * Aceita mensagens de chat e responde usando Claude API server-side.
 * A API key fica segura no servidor, nunca exposta ao browser.
 *
 * Endpoints:
 *   GET  /api/health  → { ok, mode, version }
 *   POST /api/chat    → { message, context? } → { response }
 *
 * Env:
 *   ANTHROPIC_API_KEY  — obrigatória para modo live
 *   PORT               — default 3847
 *
 * Uso: ANTHROPIC_API_KEY=sk-... npx tsx mcp-server/src/http-bridge.ts
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import Anthropic from '@anthropic-ai/sdk';
import { campaigns, creatives, metrics, emq } from './demo-data.js';

const PORT = parseInt(process.env.PORT || '3847', 10);
const API_KEY = process.env.ANTHROPIC_API_KEY || '';

// ─── System prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(context?: ChatContext): string {
  const cpa = context?.cpa ?? metrics.cpa;
  const roas = context?.roas ?? metrics.roas;
  const ctr = context?.ctr ?? metrics.ctr;
  const cpm = context?.cpm ?? metrics.cpm;
  const spend = context?.spend ?? metrics.spend;
  const conversions = context?.conversions ?? metrics.conversions;
  const accountScore = context?.accountScore ?? metrics.accountScore;
  const emqScore = context?.emqScore ?? emq.score;
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;

  return `Você é o Apex, um consultor especialista em Meta Ads (Facebook/Instagram) com conhecimento profundo sobre:
- Andromeda (retrieval engine), GEM (ranking model), Entity ID clustering
- Signal Engineering e CAPI (Conversions API)
- Otimização de criativos, hooks e novelty bias
- Estratégias de lance e budget

Dados atuais da conta:
- CPA: R$ ${cpa.toFixed(2)}
- ROAS: ${roas.toFixed(2)}x
- CTR: ${ctr.toFixed(2)}%
- CPM: R$ ${cpm.toFixed(2)}
- Investimento: R$ ${spend.toLocaleString('pt-BR')}
- Conversões: ${conversions}
- Score da Conta: ${accountScore}/100
- EMQ: ${emqScore}/10
- Campanhas ativas: ${activeCampaigns}
- Criativos: ${creatives.length} (${creatives.filter((c) => c.status === 'winner').length} winners, ${creatives.filter((c) => c.status === 'loser').length} losers)
- Entity IDs: ${new Set(creatives.map((c) => c.entity_id_group)).size} grupos

Responda sempre em português brasileiro. Seja direto, prático e baseado em dados.`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface ChatRequest {
  message: string;
  context?: ChatContext;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res: ServerResponse, status: number, data: unknown): void {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

// ─── Demo responses (fallback sem API key) ───────────────────────────────────

function getDemoResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('visao geral') || lower.includes('overview') || lower.includes('geral')) {
    return `**Análise Geral da Conta**

Score: 74/100 (Bom). CPA R$ 52,40, ROAS 3.24x.

**Winners:** [ASC] Protocolo Detox (ROAS 3.82x, Score 87), [RETARGET] Carrinho Abandonado (ROAS 5.21x).

**Ação imediata:** Pausar Colágeno Premium (ROAS 0.82x), escalar Protocolo Detox +10%, corrigir CAPI para subir EMQ de 6.8 para 8.0+.`;
  }

  if (lower.includes('criativ') || lower.includes('entity')) {
    return `**Análise de Criativos**

24 criativos em 5 Entity IDs. Group B (statics) está OVERCROWDED com 5 criativos — Andromeda usa apenas 1 ticket.

**Escalar:** Reels Trend Sound (Score 96), UGC Influencer (Score 95).
**Pausar:** Carrossel 5 Produtos (Score 22), Static Comparativo (Score 18).

Crie 3 novos criativos em formatos diferentes para adicionar Entity IDs ao leilão.`;
  }

  if (lower.includes('emq') || lower.includes('signal') || lower.includes('capi')) {
    return `**Signal Engineering — EMQ 6.8/10**

FBC (click ID) perdendo 0.2 pontos. Para subir para Nível 4 (EMQ 8.5+), adicione predicted_ltv, margin_tier e engagement_score no custom_data do CAPI.

**Impacto:** EMQ 6.8→8.4 = CPA -11% = economia de ~R$ 5.057/semana.`;
  }

  return `**Análise Personalizada**

Com base nos dados da conta (CPA R$ 52,40, ROAS 3.24x, EMQ 6.8):
- Foque em criativos UGC (Hook Rate 45%+ vs statics 18%)
- Andromeda favorece broad targeting — campanhas sem segmentação performam 3.2x melhor
- EMQ abaixo do ideal está custando ~11% a mais no CPA

Selecione um tópico específico para análise detalhada.`;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

async function handleHealth(res: ServerResponse): Promise<void> {
  json(res, 200, {
    ok: true,
    mode: API_KEY ? 'live' : 'demo',
    version: '1.0.0',
    name: 'apex-mcp-server',
  });
}

async function handleChat(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  let parsed: ChatRequest;

  try {
    parsed = JSON.parse(body) as ChatRequest;
  } catch {
    json(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  if (!parsed.message?.trim()) {
    json(res, 400, { error: 'Missing "message" field' });
    return;
  }

  // Se não tem API key, retorna resposta demo
  if (!API_KEY) {
    json(res, 200, {
      response: getDemoResponse(parsed.message),
      mode: 'demo',
    });
    return;
  }

  // Chamada real à Claude API (server-side, key segura)
  try {
    const client = new Anthropic({ apiKey: API_KEY });
    const result = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: buildSystemPrompt(parsed.context),
      messages: [{ role: 'user', content: parsed.message }],
    });

    const text = result.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    json(res, 200, { response: text, mode: 'live' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    json(res, 500, { error: `Claude API error: ${message}`, mode: 'error' });
  }
}

// ─── Server ──────────────────────────────────────────────────────────────────

const httpServer = createServer(async (req, res) => {
  cors(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  try {
    if ((url.pathname === '/api/health' || url.pathname === '/api/apex/chat') && req.method === 'GET') {
      await handleHealth(res);
    } else if ((url.pathname === '/api/chat' || url.pathname === '/api/apex/chat') && req.method === 'POST') {
      await handleChat(req, res);
    } else {
      json(res, 404, { error: 'Not found' });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    json(res, 500, { error: message });
  }
});

httpServer.listen(PORT, () => {
  const mode = API_KEY ? 'live (Claude API)' : 'demo (respostas mock)';
  console.log(`🚀 Apex HTTP Bridge rodando em http://localhost:${PORT} [${mode}]`);
  console.log(`   GET  /api/apex/chat  (health check)`);
  console.log(`   POST /api/apex/chat  { "message": "..." }`);
  if (!API_KEY) {
    console.log(`\n⚠️  Sem ANTHROPIC_API_KEY — rodando em modo demo.`);
    console.log(`   Para ativar: ANTHROPIC_API_KEY=sk-... npx tsx mcp-server/src/http-bridge.ts`);
  }
});
