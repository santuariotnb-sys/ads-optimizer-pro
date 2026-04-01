/**
 * mcpClient.ts — Cliente HTTP que conecta o React app ao Apex MCP HTTP Bridge.
 *
 * Substitui o localBridgeClient.ts (que dependia de window.agentBridge).
 * Fala com o servidor HTTP local em localhost:3847.
 *
 * Uso:
 *   import { mcpBridge } from './mcpClient';
 *
 *   const status = await mcpBridge.getStatus();
 *   if (status.available) {
 *     const response = await mcpBridge.chat('Analise minhas campanhas', context);
 *   }
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface McpBridgeStatus {
  available: boolean;
  mode: 'live' | 'demo' | 'engine' | 'offline';
  version?: string;
}

export interface McpChatContext {
  cpa?: number;
  roas?: number;
  ctr?: number;
  cpm?: number;
  spend?: number;
  conversions?: number;
  accountScore?: number;
  emqScore?: number;
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

// ─── Config ──────────────────────────────────────────────────────────────────

/** Em produção usa /api/apex/chat (Vercel serverless). Local usa localhost:3847. */
function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return ''; // Produção: relative path → /api/apex/chat
  }
  return 'http://localhost:3847'; // Local: HTTP bridge
}

const HEALTH_TIMEOUT_MS = 2000;
const CHAT_TIMEOUT_MS = 30000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const mcpBridge = {
  /**
   * Verifica se o HTTP Bridge está rodando.
   * Timeout curto (2s) para não travar a UI.
   */
  async getStatus(): Promise<McpBridgeStatus> {
    try {
      const base = getBaseUrl();
      const res = await fetchWithTimeout(
        `${base}/api/apex/chat`,
        { method: 'GET' },
        HEALTH_TIMEOUT_MS,
      );

      if (!res.ok) {
        return { available: false, mode: 'offline' };
      }

      const data = (await res.json()) as HealthResponse;
      return {
        available: data.ok,
        mode: data.mode,
        version: data.version,
      };
    } catch {
      return { available: false, mode: 'offline' };
    }
  },

  /**
   * Envia mensagem para o Apex via HTTP Bridge.
   * O servidor usa Claude API server-side (key segura) ou retorna resposta demo.
   */
  async chat(message: string, context?: McpChatContext): Promise<string> {
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

    if (data.error) {
      throw new Error(data.error);
    }

    return data.response;
  },
};
