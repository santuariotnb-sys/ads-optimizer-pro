#!/usr/bin/env node
'use strict';

/**
 * Diagnóstico do Agent Bridge
 * Uso: node scripts/diagnose.js
 *
 * Verifica tudo que pode dar errado e diz exatamente como corrigir.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync, spawnSync } = require('child_process');

const HOST_NAME = 'com.agentbridge.claude';

function check(label, ok, fix) {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${label}`);
  if (!ok && fix) console.log(`   → ${fix}`);
  return ok;
}

function getManifestPath() {
  const platform = os.platform();
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts', `${HOST_NAME}.json`);
  } else if (platform === 'linux') {
    return path.join(os.homedir(), '.config', 'google-chrome', 'NativeMessagingHosts', `${HOST_NAME}.json`);
  } else if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Local', 'agent-bridge', `${HOST_NAME}.json`);
  }
  return null;
}

console.log('\n🔍 Agent Bridge — Diagnóstico\n');
console.log('   Plataforma:', os.platform(), os.arch());
console.log('   Node.js:   ', process.version);
console.log('   Usuário:   ', os.userInfo().username);
console.log('   Home:      ', os.homedir());
console.log('');

// 1. Verifica manifesto
const manifestPath = getManifestPath();
const manifestExists = manifestPath && fs.existsSync(manifestPath);
check('Manifesto do native host existe', manifestExists,
  `Execute: node scripts/install.js SEU_EXTENSION_ID`);

if (manifestExists) {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    check('Manifesto é JSON válido', true);
  } catch (e) {
    check('Manifesto é JSON válido', false, `Erro: ${e.message} — reinstale com: node scripts/install.js`);
  }

  if (manifest) {
    // Verifica binary path
    const binaryExists = manifest.path && fs.existsSync(manifest.path);
    check(`Binary existe: ${manifest.path}`, binaryExists,
      'Execute: node scripts/install.js para recriar o wrapper');

    if (binaryExists) {
      try {
        fs.accessSync(manifest.path, fs.constants.X_OK);
        check('Binary é executável', true);
      } catch (_) {
        check('Binary é executável', false,
          `Execute: chmod +x "${manifest.path}"`);
      }
    }

    // Verifica extension ID
    const origins = manifest.allowed_origins || [];
    const hasRealId = origins.some(o => !o.includes('__EXTENSION_ID__'));
    check('Extension ID configurado', hasRealId,
      'Execute: node scripts/install.js SEU_ID_REAL (veja chrome://extensions)');

    if (hasRealId) {
      console.log('   Origins:', origins.join(', '));
    }
  }
}

// 2. Verifica Windows registry
if (os.platform() === 'win32') {
  try {
    const regKey = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`;
    execSync(`REG QUERY "${regKey}"`, { stdio: 'ignore' });
    check('Chave de registry existe (Windows)', true);
  } catch (_) {
    check('Chave de registry existe (Windows)', false,
      'Execute: node scripts/install.js para criar a chave');
  }
}

// 3. Verifica Claude Code
console.log('');
const claudeCandidates = [
  'claude',
  path.join(os.homedir(), '.npm-global/bin/claude'),
  path.join(os.homedir(), '.local/bin/claude'),
  '/usr/local/bin/claude',
  '/opt/homebrew/bin/claude',
];

let claudePath = null;
for (const c of claudeCandidates) {
  try {
    fs.accessSync(c, fs.constants.X_OK);
    claudePath = c;
    break;
  } catch (_) {}
}

check('Claude Code CLI encontrado', !!claudePath,
  'Execute: npm install -g @anthropic-ai/claude-code');

if (claudePath) {
  console.log('   Path:', claudePath);

  const versionResult = spawnSync(claudePath, ['--version'], { timeout: 3000 });
  const versionOk = versionResult.status === 0;
  const version = versionResult.stdout?.toString().trim();
  check(`Claude Code versão: ${version || '(não detectada)'}`, versionOk,
    'Reinstale: npm install -g @anthropic-ai/claude-code');

  // Testa autenticação (modo leve — só checa se o config existe)
  const configPath = path.join(os.homedir(), '.claude', 'config.json');
  const configExists = fs.existsSync(configPath);
  check('Arquivo de config do Claude Code existe', configExists,
    'Execute "claude" no terminal e faça login');
}

// 4. Verifica Node.js no PATH (necessário para o wrapper)
const nodeVersion = parseInt(process.version.replace('v', ''));
check(`Node.js >= 18 (atual: ${process.version})`, nodeVersion >= 18,
  'Atualize o Node.js: https://nodejs.org');

console.log('\n─────────────────────────────────────');

if (!manifestExists || !claudePath) {
  console.log('⚠️  Problemas encontrados. Siga as instruções acima.');
  console.log('\nInstalação rápida:');
  console.log('  1. npm install -g @anthropic-ai/claude-code');
  console.log('  2. claude                          # faz login');
  console.log('  3. node scripts/install.js ID_EXT  # registra o host');
  console.log('  4. Reinicie o Chrome\n');
} else {
  console.log('✅ Tudo parece OK! Se ainda não funcionar:');
  console.log('   - Verifique se o Chrome foi reiniciado após a instalação');
  console.log('   - Abra o DevTools da extensão em chrome://extensions');
  console.log('   - Confira os logs do background.js\n');
}
