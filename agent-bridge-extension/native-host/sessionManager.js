'use strict';

/**
 * Gerencia sessões de tarefas ativas.
 * Cada sessão tem um AbortController para cancelamento.
 */
class SessionManager {
  constructor() {
    this._sessions = new Map(); // id -> { controller, startedAt, prompt }
  }

  /**
   * Cria uma nova sessão e retorna o AbortSignal.
   * @param {string} id
   * @param {string} prompt
   * @returns {AbortSignal}
   */
  create(id, prompt) {
    const controller = new AbortController();
    this._sessions.set(id, {
      controller,
      startedAt: Date.now(),
      prompt: prompt.substring(0, 100), // armazena preview do prompt
    });
    return controller.signal;
  }

  /**
   * Cancela uma sessão ativa.
   * @param {string} id
   * @returns {boolean} true se cancelou, false se não encontrou
   */
  cancel(id) {
    const session = this._sessions.get(id);
    if (!session) return false;
    session.controller.abort();
    this._sessions.delete(id);
    return true;
  }

  /**
   * Remove sessão após conclusão.
   * @param {string} id
   */
  complete(id) {
    this._sessions.delete(id);
  }

  /**
   * Retorna lista de sessões ativas para status.
   * @returns {Array}
   */
  list() {
    const now = Date.now();
    return Array.from(this._sessions.entries()).map(([id, s]) => ({
      id,
      prompt: s.prompt,
      runningMs: now - s.startedAt,
    }));
  }

  get count() {
    return this._sessions.size;
  }
}

module.exports = { SessionManager };
