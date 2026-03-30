'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Detecta se claude CLI está instalado e autenticado.
 * Retorna { installed, authenticated, path }
 */
async function detectClaudeCode() {
  return new Promise((resolve) => {
    // Tenta encontrar o binário
    const candidates = [
      'claude',
      path.join(process.env.HOME || '', '.npm-global/bin/claude'),
      path.join(process.env.HOME || '', '.local/bin/claude'),
      '/usr/local/bin/claude',
      '/opt/homebrew/bin/claude',
    ];

    let found = null;
    for (const c of candidates) {
      try {
        fs.accessSync(c, fs.constants.X_OK);
        found = c;
        break;
      } catch (_) {}
    }

    if (!found) {
      return resolve({ installed: false, authenticated: false, path: null });
    }

    // Testa autenticação com um comando leve
    const proc = spawn(found, ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.on('close', (code) => {
      resolve({
        installed: true,
        authenticated: code === 0,
        path: found,
        version: out.trim(),
      });
    });
    proc.on('error', () => {
      resolve({ installed: false, authenticated: false, path: null });
    });

    setTimeout(() => {
      proc.kill();
      resolve({ installed: true, authenticated: false, path: found });
    }, 3000);
  });
}

/**
 * Executa uma tarefa via claude -p com streaming JSON.
 *
 * @param {object} opts
 * @param {string} opts.claudePath  - Caminho do binário
 * @param {string} opts.prompt      - Prompt principal
 * @param {string} [opts.cwd]       - Working directory (padrão: home)
 * @param {string[]} [opts.tools]   - Tools permitidas (ex: ['Read','Bash'])
 * @param {function} opts.onEvent   - Callback para cada evento { type, data }
 * @param {AbortSignal} [opts.signal] - Para cancelar
 * @returns {Promise<{ exitCode: number }>}
 */
function runTask({ claudePath, prompt, cwd, tools, onEvent, signal }) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', prompt,
      '--output-format', 'stream-json',
      '--bare',
    ];

    if (tools && tools.length > 0) {
      args.push('--allowedTools', tools.join(','));
    }

    const workDir = cwd || process.env.HOME || process.cwd();

    const proc = spawn(claudePath, args, {
      cwd: workDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stderrBuf = '';

    // Processa stdout linha a linha (stream-json = newline-delimited JSON)
    let lineBuf = '';
    proc.stdout.on('data', (chunk) => {
      lineBuf += chunk.toString('utf8');
      const lines = lineBuf.split('\n');
      lineBuf = lines.pop(); // último fragmento sem \n fica no buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const event = JSON.parse(trimmed);
          onEvent({ type: 'stream', data: event });
        } catch (_) {
          // linha não é JSON válido — ignora (pode ser log interno)
        }
      }
    });

    proc.stderr.on('data', (chunk) => {
      stderrBuf += chunk.toString('utf8');
    });

    proc.on('close', (code) => {
      // Flush do buffer restante
      if (lineBuf.trim()) {
        try {
          const event = JSON.parse(lineBuf.trim());
          onEvent({ type: 'stream', data: event });
        } catch (_) {}
      }

      if (code === 0) {
        onEvent({ type: 'done', exitCode: 0 });
        resolve({ exitCode: 0 });
      } else {
        const errMsg = stderrBuf.trim() || `claude saiu com código ${code}`;
        onEvent({ type: 'error', message: errMsg, exitCode: code });
        resolve({ exitCode: code }); // resolve (não reject) para não quebrar o loop principal
      }
    });

    proc.on('error', (err) => {
      onEvent({ type: 'error', message: err.message });
      reject(err);
    });

    // Suporte a cancelamento via AbortSignal
    if (signal) {
      signal.addEventListener('abort', () => {
        proc.kill('SIGTERM');
        onEvent({ type: 'cancelled' });
        resolve({ exitCode: -1 });
      });
    }
  });
}

module.exports = { detectClaudeCode, runTask };
