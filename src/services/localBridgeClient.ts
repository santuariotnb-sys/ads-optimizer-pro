/**
 * localBridgeClient.ts
 *
 * Substitui getAnthropicKey() no Agent.tsx.
 * Detecta a extensão Agent Bridge e expõe uma API tipada para o seu app.
 *
 * Uso no Agent.tsx:
 *   import { localBridge, BridgeStatus } from './localBridgeClient';
 *
 *   // Verifica se bridge está disponível
 *   const status = await localBridge.getStatus();
 *   if (!status.available) { ... mostrar onboarding ... }
 *
 *   // Envia uma tarefa
 *   const task = localBridge.sendTask({
 *     prompt: 'Analise as campanhas e sugira otimizações',
 *     onStream: (event) => console.log(event),
 *     onDone: () => console.log('concluído'),
 *     onError: (err) => console.error(err),
 *   });
 *
 *   // Cancela se necessário
 *   task.cancel();
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface BridgeStatus {
  available: boolean;       // extensão detectada na página
  installed: boolean;       // claude CLI instalado
  authenticated: boolean;   // claude CLI autenticado
  version?: string;
  activeSessions?: number;
  error?: string;
}

export interface SendTaskOptions {
  prompt: string;
  cwd?: string;
  tools?: string[];
  onStream?: (event: unknown) => void;
  onDone?: (result: { cancelled?: boolean }) => void;
  onError?: (err: Error) => void;
}

export interface TaskHandle {
  id: string;
  cancel: () => void;
}

// ─── Detecção do bridge ───────────────────────────────────────────────────────

declare global {
  interface Window {
    agentBridge?: {
      status: () => Promise<BridgeStatus>;
      sendTask: (opts: SendTaskOptions) => TaskHandle;
      cancelTask: (id: string) => Promise<void>;
      listSessions: () => Promise<unknown[]>;
    };
    __agentBridgeInjected?: boolean;
  }
}

function isBridgeAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.agentBridge;
}

/** Aguarda o bridge ficar disponível (máx 1.5s) */
function waitForBridge(timeoutMs = 1500): Promise<boolean> {
  if (isBridgeAvailable()) return Promise.resolve(true);

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      window.removeEventListener('agentBridgeReady', onReady);
      resolve(false);
    }, timeoutMs);

    function onReady() {
      clearTimeout(timer);
      resolve(true);
    }

    window.addEventListener('agentBridgeReady', onReady, { once: true });
  });
}

// ─── API pública ──────────────────────────────────────────────────────────────

export const localBridge = {

  /**
   * Retorna o status completo do bridge + Claude Code.
   * Retorna { available: false } se a extensão não estiver instalada.
   */
  async getStatus(): Promise<BridgeStatus> {
    const available = await waitForBridge();
    if (!available) {
      return { available: false, installed: false, authenticated: false };
    }

    try {
      const status = await window.agentBridge!.status();
      return { ...status, available: true };
    } catch (err: unknown) {
      return {
        available: true,
        installed: false,
        authenticated: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  /**
   * Envia uma tarefa ao Claude Code com streaming.
   * Retorna um TaskHandle com método cancel().
   *
   * Lança erro se bridge não estiver disponível.
   */
  sendTask(opts: SendTaskOptions): TaskHandle {
    if (!isBridgeAvailable()) {
      opts.onError?.(new Error('Agent Bridge não está disponível. Instale a extensão.'));
      return { id: 'unavailable', cancel: () => {} };
    }

    return window.agentBridge!.sendTask(opts);
  },

  /** Lista sessões ativas no native host */
  async listSessions(): Promise<unknown[]> {
    if (!isBridgeAvailable()) return [];
    return window.agentBridge!.listSessions();
  },

  /** Verdadeiro quando a extensão está injetada na página */
  isAvailable: isBridgeAvailable,
};
