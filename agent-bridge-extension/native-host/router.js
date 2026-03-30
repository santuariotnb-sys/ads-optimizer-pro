'use strict';

const { detectClaudeCode, runTask } = require('./claudeAdapter');
const { SessionManager } = require('./sessionManager');

const sessions = new SessionManager();
let claudeStatus = null; // cache do status de detecção

// Atualiza status a cada 30s em background
async function refreshClaudeStatus() {
  claudeStatus = await detectClaudeCode();
  setTimeout(refreshClaudeStatus, 30_000);
}
refreshClaudeStatus();

/**
 * Processa uma mensagem recebida da extensão Chrome e retorna
 * os eventos de resposta via callback `send`.
 *
 * Protocolo de entrada:
 *   { id, command, ...params }
 *
 * Comandos suportados:
 *   status        → retorna estado do Claude Code (instalado/autenticado)
 *   sendTask      → executa claude -p em streaming
 *   cancelTask    → cancela task em andamento
 *   listSessions  → lista tasks ativas
 *
 * @param {object} message
 * @param {function} send  - função para enviar resposta de volta
 */
async function handleMessage(message, send) {
  const { id, command } = message;

  if (!id || !command) {
    return send({ id, type: 'error', message: 'Mensagem inválida: faltam id ou command' });
  }

  switch (command) {

    case 'status': {
      // Usa cache (atualizado em background)
      if (!claudeStatus) {
        claudeStatus = await detectClaudeCode();
      }
      return send({
        id,
        type: 'status',
        provider: 'claude-code',
        installed: claudeStatus.installed,
        authenticated: claudeStatus.authenticated,
        version: claudeStatus.version || null,
        activeSessions: sessions.count,
      });
    }

    case 'sendTask': {
      const { prompt, cwd, tools } = message;

      if (!prompt || typeof prompt !== 'string') {
        return send({ id, type: 'error', message: 'sendTask requer campo "prompt"' });
      }

      // Garante que claude está disponível
      if (!claudeStatus) {
        claudeStatus = await detectClaudeCode();
      }
      if (!claudeStatus.installed) {
        return send({ id, type: 'error', message: 'Claude Code não está instalado. Instale com: npm install -g @anthropic-ai/claude-code' });
      }
      if (!claudeStatus.authenticated) {
        return send({ id, type: 'error', message: 'Claude Code não está autenticado. Execute: claude (no terminal) e faça login.' });
      }

      const signal = sessions.create(id, prompt);

      try {
        await runTask({
          claudePath: claudeStatus.path,
          prompt,
          cwd,
          tools: tools || [],
          signal,
          onEvent: (event) => {
            send({ id, ...event });
          },
        });
      } finally {
        sessions.complete(id);
      }
      return;
    }

    case 'cancelTask': {
      const { taskId } = message;
      const cancelled = sessions.cancel(taskId || id);
      return send({ id, type: 'cancelled', taskId: taskId || id, success: cancelled });
    }

    case 'listSessions': {
      return send({ id, type: 'sessions', sessions: sessions.list() });
    }

    default: {
      return send({ id, type: 'error', message: `Comando desconhecido: ${command}` });
    }
  }
}

module.exports = { handleMessage };
