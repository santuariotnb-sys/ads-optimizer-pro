// Ads Optimizer Pro — Content Script
// Injeta side panel no Facebook Ads Manager

(function() {
  'use strict';

  const PANEL_WIDTH = 360;
  let panelVisible = false;
  let panelElement = null;

  function createPanel() {
    if (panelElement) return;

    panelElement = document.createElement('div');
    panelElement.id = 'ads-optimizer-panel';
    panelElement.innerHTML = `
      <div class="aop-header">
        <div class="aop-logo">
          <span class="aop-logo-icon">A</span>
          <span class="aop-logo-text">Ads Optimizer Pro</span>
        </div>
        <button class="aop-close" id="aop-close">&times;</button>
      </div>
      <div class="aop-status" id="aop-status">
        <span class="aop-dot aop-dot-demo"></span>
        <span>Modo Demo — Conecte-se para dados reais</span>
      </div>
      <div class="aop-metrics" id="aop-metrics">
        <div class="aop-metric-card">
          <span class="aop-metric-label">CPA</span>
          <span class="aop-metric-value">R$ 52,40</span>
          <span class="aop-metric-change aop-positive">-8.3%</span>
        </div>
        <div class="aop-metric-card">
          <span class="aop-metric-label">ROAS</span>
          <span class="aop-metric-value">3.24x</span>
          <span class="aop-metric-change aop-positive">+12.5%</span>
        </div>
        <div class="aop-metric-card">
          <span class="aop-metric-label">CTR</span>
          <span class="aop-metric-value">1.92%</span>
          <span class="aop-metric-change aop-positive">+5.2%</span>
        </div>
        <div class="aop-metric-card">
          <span class="aop-metric-label">Gasto</span>
          <span class="aop-metric-value">R$ 49.6K</span>
          <span class="aop-metric-change aop-neutral">7d</span>
        </div>
      </div>
      <div class="aop-section">
        <h3 class="aop-section-title">Alertas Recentes</h3>
        <div class="aop-alert aop-alert-critical">
          <span>CPA disparou +32% — Colágeno Premium</span>
        </div>
        <div class="aop-alert aop-alert-success">
          <span>Winner: VSL Detox 60s — Escalar +10%</span>
        </div>
        <div class="aop-alert aop-alert-warning">
          <span>Fadiga criativa — Static Antes/Depois</span>
        </div>
      </div>
      <div class="aop-section">
        <h3 class="aop-section-title">Entity IDs</h3>
        <div class="aop-entity-summary">
          <span>24 criativos → 5 Entity IDs</span>
          <span class="aop-warning-badge">1 superlotado</span>
        </div>
      </div>
      <div class="aop-section">
        <h3 class="aop-section-title">Ações Rápidas</h3>
        <button class="aop-action-btn aop-btn-scale">Escalar Winners +20%</button>
        <button class="aop-action-btn aop-btn-pause">Pausar Losers</button>
        <button class="aop-action-btn aop-btn-refresh">Refresh Métricas</button>
      </div>
      <div class="aop-footer">
        <a href="#" class="aop-open-app">Abrir App Completo →</a>
      </div>
    `;

    document.body.appendChild(panelElement);

    document.getElementById('aop-close')?.addEventListener('click', togglePanel);

    // Listen for token updates from background
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'TOKEN_CAPTURED') {
        const status = document.getElementById('aop-status');
        if (status) {
          status.innerHTML = '<span class="aop-dot aop-dot-live"></span><span>Conectado — Dados reais</span>';
        }
      }
    });
  }

  function togglePanel() {
    panelVisible = !panelVisible;
    if (!panelElement) createPanel();
    panelElement.style.transform = panelVisible ? 'translateX(0)' : `translateX(${PANEL_WIDTH}px)`;
  }

  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'aop-toggle';
  toggleBtn.innerHTML = '<span style="font-size:18px;font-weight:700">A</span>';
  toggleBtn.title = 'Ads Optimizer Pro';
  document.body.appendChild(toggleBtn);
  toggleBtn.addEventListener('click', togglePanel);

  // Initialize panel
  createPanel();
})();
