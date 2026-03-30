#!/usr/bin/env node
'use strict';

/**
 * Agent Bridge — Native Messaging Host
 *
 * Lê mensagens do Chrome via stdin, processa, e responde via stdout.
 * Iniciado automaticamente pelo Chrome quando a extensão conecta.
 */

const { readMessage, writeMessage } = require('./nativeMessaging');
const { handleMessage } = require('./router');

// O Chrome passa a origem como primeiro argumento
// ex: chrome-extension://abcdefghijklmnopabcdefghijklmnop/
const callerOrigin = process.argv[2] || 'unknown';

// Log vai para stderr (nunca stdout — Chrome interpreta stdout como mensagem)
function log(...args) {
  process.stderr.write('[agent-bridge] ' + args.join(' ') + '\n');
}

log('Iniciado. Origem:', callerOrigin);
log('PID:', process.pid);

// Desativa buffers para garantir envio imediato
process.stdout.setDefaultEncoding('binary');

// Função de envio — serializa e escreve no stdout
function send(message) {
  try {
    writeMessage(process.stdout, message);
  } catch (err) {
    log('Erro ao enviar mensagem:', err.message);
  }
}

// Loop principal: lê mensagens até o Chrome fechar a conexão
async function main() {
  process.stdin.pause();

  while (true) {
    try {
      const message = await readMessage(process.stdin);

      if (message === null) {
        log('Chrome fechou a conexão. Encerrando.');
        process.exit(0);
      }

      log('Recebido:', message.command, '| id:', message.id);

      // Processa em background (não bloqueia o loop de leitura)
      handleMessage(message, send).catch((err) => {
        log('Erro no handler:', err.message);
        send({ id: message.id, type: 'error', message: err.message });
      });

    } catch (err) {
      log('Erro de leitura:', err.message);
      // Em erros de leitura, encerramos — Chrome vai reiniciar se necessário
      process.exit(1);
    }
  }
}

// Trata saída limpa
process.on('SIGTERM', () => {
  log('Recebido SIGTERM. Encerrando.');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  log('Exceção não capturada:', err.message, err.stack);
  process.exit(1);
});

main();
