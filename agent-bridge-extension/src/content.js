// content.js — Injeta API do bridge na janela da página
// A página acessa via window.agentBridge

(function () {
  'use strict';

  // Evita injeção dupla
  if (window.__agentBridgeInjected) return;
  window.__agentBridgeInjected = true;

  // Contador de IDs únicos por sessão
  let _idCounter = 0;
  function genId() {
    return `ab_${Date.now()}_${++_idCounter}`;
  }

  // Registry de listeners de streaming (id → callback[])
  const _streamListeners = new Map();

  // Recebe eventos de streaming vindos do background
  chrome.runtime.onMessage.addListener((message) => {
    if (!message.bridgeEvent) return;
    const listeners = _streamListeners.get(message.id);
    if (listeners) {
      for (const fn of listeners) fn(message);
      if (message.type === 'done' || message.type === 'error' || message.type === 'cancelled') {
        _streamListeners.delete(message.id);
      }
    }
  });

  /**
   * API exposta para o seu app (Agent.tsx, etc.)
   */
  const agentBridge = {

    /**
     * Verifica status do Claude Code.
     * @returns {Promise<{installed, authenticated, version, activeSessions}>}
     */
    status() {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { command: 'status', id: genId() },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });
    },

    /**
     * Envia uma tarefa ao Claude Code com streaming.
     *
     * @param {object} opts
     * @param {string} opts.prompt       - Prompt principal
     * @param {string} [opts.cwd]        - Working directory
     * @param {string[]} [opts.tools]    - Ex: ['Read', 'Bash']
     * @param {function} opts.onStream   - Chamado a cada evento de streaming
     * @param {function} [opts.onDone]   - Chamado ao concluir
     * @param {function} [opts.onError]  - Chamado em erro
     * @returns {{ id: string, cancel: function }}
     */
    sendTask({ prompt, cwd, tools, onStream, onDone, onError }) {
      const id = genId();

      _streamListeners.set(id, [(event) => {
        if (event.type === 'stream') {
          onStream?.(event.data);
        } else if (event.type === 'done') {
          onDone?.(event);
        } else if (event.type === 'error') {
          onError?.(new Error(event.message));
        } else if (event.type === 'cancelled') {
          onDone?.({ cancelled: true });
        }
      }]);

      chrome.runtime.sendMessage({ command: 'sendTask', id, prompt, cwd, tools });

      return {
        id,
        cancel: () => this.cancelTask(id),
      };
    },

    /**
     * Cancela uma tarefa em andamento.
     * @param {string} taskId
     * @returns {Promise}
     */
    cancelTask(taskId) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { command: 'cancelTask', id: genId(), taskId },
          resolve
        );
      });
    },

    /**
     * Lista sessões ativas.
     * @returns {Promise<Array>}
     */
    listSessions() {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { command: 'listSessions', id: genId() },
          (response) => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else resolve(response?.sessions || []);
          }
        );
      });
    },
  };

  // Expõe na janela
  window.agentBridge = agentBridge;

  // Dispara evento para o app saber que o bridge está pronto
  window.dispatchEvent(new CustomEvent('agentBridgeReady'));

})();
