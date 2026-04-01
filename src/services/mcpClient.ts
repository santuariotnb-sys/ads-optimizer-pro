/**
 * mcpClient.ts — Cliente HTTP que conecta o React app ao Apex Engine.
 *
 * Envia dados REAIS do Zustand store para o serverless function.
 * O motor de análise trabalha com os dados recebidos, não com placeholders.
 */

import type { Campaign, Creative, DashboardMetrics } from '../types/meta';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface McpBridgeStatus {
  available: boolean;
  mode: 'live' | 'demo' | 'engine' | 'offline';
  version?: string;
}

/** Dados reais enviados do store para o motor de análise */
export interface McpChatContext {
  metrics: DashboardMetrics;
  emqScore: number;
  campaigns: McpCampaign[];
  creatives: McpCreative[];
}

/** Subset compacto de Campaign para enviar ao servidor */
export interface McpCampaign {
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

/** Subset compacto de Creative para enviar ao servidor */
export interface McpCreative {
  name: string;
  entity_id_group: number | string;
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

interface HealthResponse {
  ok: boolean;
  mode: 'live' | 'demo' | 'engine';
  version: string;
}

interface ChatResponse {
  response: string;
  mode: 'live' | 'demo' | 'engine' | 'error';
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '';
  }
  return 'http://localhost:3847';
}

const HEALTH_TIMEOUT_MS = 2000;
const CHAT_TIMEOUT_MS = 30000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Extrai campos compactos de Campaign para envio */
export function toCampaignContext(c: Campaign): McpCampaign {
  return {
    name: c.name, status: c.status, objective: c.objective,
    daily_budget: c.daily_budget, roas: c.roas, cpa: c.cpa,
    ctr: c.ctr, cpm: c.cpm, spend: c.spend, conversions: c.conversions,
    impressions: c.impressions, frequency: c.frequency,
    opportunity_score: c.opportunity_score,
    ...(c.learning_days != null ? { learning_days: c.learning_days } : {}),
    ...(c.learning_conversions != null ? { learning_conversions: c.learning_conversions } : {}),
  };
}

/** Extrai campos compactos de Creative para envio */
export function toCreativeContext(c: Creative): McpCreative {
  return {
    name: c.name, entity_id_group: c.entity_id_group,
    hook_rate: c.hook_rate, hold_rate: c.hold_rate,
    ctr: c.ctr, cpa: c.cpa, cpm: c.cpm, score: c.score,
    status: c.status, novelty_days: c.novelty_days,
    spend: c.spend, cpm_trend: c.cpm_trend,
  };
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const mcpBridge = {
  async getStatus(): Promise<McpBridgeStatus> {
    try {
      const base = getBaseUrl();
      const res = await fetchWithTimeout(`${base}/api/apex/chat`, { method: 'GET' }, HEALTH_TIMEOUT_MS);
      if (!res.ok) return { available: false, mode: 'offline' };
      const data = (await res.json()) as HealthResponse;
      return { available: data.ok, mode: data.mode, version: data.version };
    } catch {
      return { available: false, mode: 'offline' };
    }
  },

  async chat(message: string, context: McpChatContext): Promise<string> {
    const base = getBaseUrl();
    const res = await fetchWithTimeout(
      `${base}/api/apex/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      },
      CHAT_TIMEOUT_MS,
    );

    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }

    const data = (await res.json()) as ChatResponse;
    if (data.error) throw new Error(data.error);
    return data.response;
  },
};
