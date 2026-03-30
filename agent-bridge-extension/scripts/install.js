#!/usr/bin/env node
'use strict';

/**
 * Instala o Agent Bridge como Native Messaging Host no Chrome.
 *
 * Uso:
 *   node scripts/install.js [EXTENSION_ID]
 *
 * Se EXTENSION_ID não for fornecido, usa placeholder e instrui o usuário.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const EXTENSION_ID = process.argv[2] || '__EXTENSION_ID__';
const HOST_NAME = 'com.agentbridge.claude';
const BRIDGE_ENTRY = path.resolve(__dirname, '..', 'native-host', 'index.js');

// Detecta caminho do Node.js para o shebang ser correto
let nodePath;
try {
  nodePath = execSync('which node').toString().trim();
} catch (_) {
  nodePath = process.execPath;
}

// Cria wrapper shell (necessário porque Chrome precisa de executável nativo)
function createShellWrapper(targetDir) {
  const wrapperPath = path.join(targetDir, 'agent-bridge');
  const content = `#!/bin/sh\nexec "${nodePath}" "${BRIDGE_ENTRY}" "$@"\n`;
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(wrapperPath, content, { mode: 0o755 });
  return wrapperPath;
}

// Cria wrapper .bat para Windows
function createBatWrapper(targetDir) {
  const wrapperPath = path.join(targetDir, 'agent-bridge.bat');
  const content = `@echo off\n"${process.execPath}" "${BRIDGE_ENTRY}" %*\n`;
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(wrapperPath, content);
  return wrapperPath;
}

function getManifestDir() {
  const platform = os.platform();
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');
  } else if (platform === 'linux') {
    return path.join(os.homedir(), '.config', 'google-chrome', 'NativeMessagingHosts');
  } else if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Local', 'agent-bridge');
  }
  throw new Error(`Plataforma não suportada: ${platform}`);
}

function install() {
  const platform = os.platform();
  console.log(`\n🔧 Instalando Agent Bridge...`);
  console.log(`   Plataforma: ${platform}`);
  console.log(`   Extension ID: ${EXTENSION_ID}`);

  const manifestDir = getManifestDir();
  const wrapperDir = path.join(os.homedir(), '.agent-bridge');

  // Cria o wrapper executável
  let binaryPath;
  if (platform === 'win32') {
    binaryPath = createBatWrapper(wrapperDir);
  } else {
    binaryPath = createShellWrapper(wrapperDir);
  }

  // Gera o manifesto com os valores reais
  const manifest = {
    name: HOST_NAME,
    description: 'Agent Bridge — conecta seu app web ao Claude Code local',
    path: binaryPath,
    type: 'stdio',
    allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
  };

  // Salva o manifesto no diretório correto
  fs.mkdirSync(manifestDir, { recursive: true });
  const manifestPath = path.join(manifestDir, `${HOST_NAME}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Windows: cria entrada no registry
  if (platform === 'win32') {
    const regKey = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`;
    try {
      execSync(`REG ADD "${regKey}" /ve /t REG_SZ /d "${manifestPath}" /f`);
      console.log(`   Registry: ${regKey}`);
    } catch (err) {
      console.error('   ⚠️  Falha ao criar chave de registry:', err.message);
      console.error('   Execute manualmente:', `REG ADD "${regKey}" /ve /t REG_SZ /d "${manifestPath}" /f`);
    }
  }

  console.log(`\n✅ Instalação concluída!`);
  console.log(`   Manifesto: ${manifestPath}`);
  console.log(`   Bridge:    ${binaryPath}`);

  if (EXTENSION_ID === '__EXTENSION_ID__') {
    console.log(`\n⚠️  ATENÇÃO: Você precisa substituir o Extension ID.`);
    console.log(`   1. Instale a extensão no Chrome (chrome://extensions)`);
    console.log(`   2. Copie o ID gerado`);
    console.log(`   3. Execute novamente: node scripts/install.js SEU_EXTENSION_ID`);
  } else {
    console.log(`\n🚀 Próximo passo: reinicie o Chrome para aplicar.`);
  }
}

install();
