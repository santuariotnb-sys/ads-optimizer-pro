// background.js — Service Worker da extensão
// Ponte entre o conteúdo da página e o Native Messaging Host

const HOST_NAME = 'com.agentbridge.claude';
const ALLOWED_ORIGIN = 'https://seuapp.com'; // ← troque pelo seu domínio

let port = null; // conexão persistente com o native host
const pendingCallbacks = new Map(); // id → função de callback

// ─── Conexão com o Native Host ────────────────────────────────────────────────

function connectToHost() {
  if (port) return; // já conectado

  try {
    port = chrome.runtime.connectNative(HOST_NAME);
  } catch (err) {
    console.error('[bridge] Falha ao conectar ao native host:', err);
    port = null;
    return;
  }

  port.onMessage.addListener((message) => {
    const cb = pendingCallbacks.get(message.id);
    if (cb) {
      const isDone = message.type === 'done'
        || message.type === 'error'
        || message.type === 'cancelled';

      cb(message);

      if (isDone) {
        pendingCallbacks.delete(message.id);
      }
    }
  });

  port.onDisconnect.addListener(() => {
    console.log('[bridge] Native host desconectado:', chrome.runtime.lastError?.message);
    port = null;
    // Notifica callbacks pendentes sobre a desconexão
    for (const [id, cb] of pendingCallbacks) {
      cb({ id, type: 'error', message: 'Native host desconectado inesperadamente' });
    }
    pendingCallbacks.clear();
  });

  console.log('[bridge] Conectado ao native host.');
}

// ─── Envio de mensagens ───────────────────────────────────────────────────────

function sendToHost(message, callback) {
  if (!port) {
    connectToHost();
  }
  if (!port) {
    callback({ id: message.id, type: 'error', message: 'Não foi possível conectar ao native host. O Agent Bridge está instalado?' });
    return;
  }

  pendingCallbacks.set(message.id, callback);

  try {
    port.postMessage(message);
  } catch (err) {
    pendingCallbacks.delete(message.id);
    callback({ id: message.id, type: 'error', message: err.message });
  }
}

// ─── Listener de mensagens do content script / página ─────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Valida origem — só aceita mensagens do seu app
  const tabUrl = sender.tab?.url || '';
  if (!tabUrl.startsWith(ALLOWED_ORIGIN) && !tabUrl.startsWith('http://localhost')) {
    sendResponse({ type: 'error', message: 'Origem não autorizada: ' + tabUrl });
    return false;
  }

  const { command, id } = request;

  if (!command || !id) {
    sendResponse({ type: 'error', message: 'Mensagem inválida: faltam command ou id' });
    return false;
  }

  // Para sendTask, precisamos de streaming — usamos callback incremental
  if (command === 'sendTask') {
    // sendResponse é one-shot no Chrome, então usamos tabs.sendMessage para streaming
    sendToHost(request, (event) => {
      chrome.tabs.sendMessage(sender.tab.id, { bridgeEvent: true, ...event }).catch(() => {});
    });
    sendResponse({ type: 'ack', id }); // confirma recebimento
    return false;
  }

  // Para comandos one-shot (status, cancel, list), sendResponse direto
  sendToHost(request, (response) => {
    sendResponse(response);
  });

  return true; // mantém o canal aberto para resposta assíncrona
});

// Conecta ao iniciar o service worker
connectToHost();
