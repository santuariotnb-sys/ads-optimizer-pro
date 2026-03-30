#!/usr/bin/env node
'use strict';

/**
 * Protocolo Chrome Native Messaging:
 * - Cada mensagem é precedida por 4 bytes (little-endian) indicando o tamanho do JSON
 * - Chrome lê de stdout, escreve em stdin do host
 * - Máx entrada: 4GB | Máx saída: 1MB por mensagem
 */

function readMessage(inputStream) {
  return new Promise((resolve, reject) => {
    // Lê os 4 bytes do tamanho
    const lenBuf = Buffer.alloc(4);
    let lenRead = 0;

    function onData(chunk) {
      const needed = 4 - lenRead;
      const take = Math.min(needed, chunk.length);
      chunk.copy(lenBuf, lenRead, 0, take);
      lenRead += take;

      if (lenRead < 4) return; // ainda lendo o header

      inputStream.removeListener('data', onData);
      inputStream.removeListener('error', onError);
      inputStream.pause();

      const msgLen = lenBuf.readUInt32LE(0);
      if (msgLen === 0) {
        // Chrome fechou a conexão
        return resolve(null);
      }

      const msgBuf = Buffer.alloc(msgLen);
      let msgRead = 0;

      // Aproveita bytes restantes do chunk atual
      if (chunk.length > take) {
        const rest = chunk.slice(take);
        const copy = Math.min(rest.length, msgLen);
        rest.copy(msgBuf, 0, 0, copy);
        msgRead += copy;
      }

      if (msgRead >= msgLen) {
        try {
          resolve(JSON.parse(msgBuf.toString('utf8')));
        } catch (e) {
          reject(new Error('JSON inválido na mensagem recebida: ' + e.message));
        }
        return;
      }

      // Continua lendo o corpo
      inputStream.resume();
      inputStream.on('data', function onBody(bodyChunk) {
        const copy = Math.min(bodyChunk.length, msgLen - msgRead);
        bodyChunk.copy(msgBuf, msgRead, 0, copy);
        msgRead += copy;

        if (msgRead >= msgLen) {
          inputStream.removeListener('data', onBody);
          inputStream.pause();
          try {
            resolve(JSON.parse(msgBuf.toString('utf8')));
          } catch (e) {
            reject(new Error('JSON inválido: ' + e.message));
          }
        }
      });
    }

    function onError(err) {
      inputStream.removeListener('data', onData);
      reject(err);
    }

    inputStream.resume();
    inputStream.on('data', onData);
    inputStream.on('error', onError);
  });
}

function writeMessage(outputStream, message) {
  const json = JSON.stringify(message);
  const jsonBuf = Buffer.from(json, 'utf8');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(jsonBuf.length, 0);
  outputStream.write(lenBuf);
  outputStream.write(jsonBuf);
}

module.exports = { readMessage, writeMessage };
