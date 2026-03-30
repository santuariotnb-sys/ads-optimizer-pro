#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const HOST_NAME = 'com.agentbridge.claude';

function getManifestDir() {
  const platform = os.platform();
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');
  } else if (platform === 'linux') {
    return path.join(os.homedir(), '.config', 'google-chrome', 'NativeMessagingHosts');
  } else if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Local', 'agent-bridge');
  }
  throw new Error('Plataforma não suportada: ' + os.platform());
}

function uninstall() {
  const platform = os.platform();
  console.log('\n🗑️  Desinstalando Agent Bridge...');

  // Remove manifesto
  const manifestPath = path.join(getManifestDir(), `${HOST_NAME}.json`);
  if (fs.existsSync(manifestPath)) {
    fs.unlinkSync(manifestPath);
    console.log('   Removido:', manifestPath);
  } else {
    console.log('   Manifesto não encontrado (já removido?)');
  }

  // Remove wrapper
  const wrapperDir = path.join(os.homedir(), '.agent-bridge');
  if (fs.existsSync(wrapperDir)) {
    fs.rmSync(wrapperDir, { recursive: true });
    console.log('   Removido:', wrapperDir);
  }

  // Windows: remove registro
  if (platform === 'win32') {
    const regKey = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`;
    try {
      execSync(`REG DELETE "${regKey}" /f`);
      console.log('   Registry removido:', regKey);
    } catch (_) {
      console.log('   Registry não encontrado (já removido?)');
    }
  }

  console.log('\n✅ Desinstalação concluída. Reinicie o Chrome para aplicar.');
}

uninstall();
