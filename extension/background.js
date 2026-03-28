// Ads Optimizer Pro — Background Service Worker
// Intercepta tokens e gerencia polling de métricas

let accessToken = null;
let adAccountId = null;
const POLLING_INTERVAL = 5 * 60 * 1000; // 5 min
const API_VERSION = 'v21.0';

// Listener para capturar access_token de chamadas ao Graph API
chrome.webRequest?.onBeforeSendHeaders?.addListener(
  (details) => {
    const url = new URL(details.url);
    const token = url.searchParams.get('access_token');
    if (token && token !== accessToken) {
      accessToken = token;
      chrome.storage.session.set({ accessToken: token });
      console.log('[AdsOptimizer] Token capturado');

      // Notifica content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'TOKEN_CAPTURED', token });
        }
      });
    }

    // Tentar capturar ad_account_id da URL
    const accountMatch = details.url.match(/act_(\d+)/);
    if (accountMatch && accountMatch[1] !== adAccountId) {
      adAccountId = accountMatch[1];
      chrome.storage.session.set({ adAccountId });
      console.log('[AdsOptimizer] Ad Account capturado:', adAccountId);
    }
  },
  { urls: ['https://graph.facebook.com/*'] },
  ['requestHeaders']
);

// Polling de métricas
chrome.alarms?.create('metricsPoll', { periodInMinutes: 5 });

chrome.alarms?.onAlarm?.addListener(async (alarm) => {
  if (alarm.name === 'metricsPoll' && accessToken && adAccountId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${API_VERSION}/act_${adAccountId}/insights?fields=cpc,cpm,ctr,spend,actions&date_preset=last_7d&access_token=${accessToken}`
      );
      const data = await response.json();

      chrome.storage.session.set({ latestMetrics: data });

      // Notifica side panel
      chrome.runtime.sendMessage({ type: 'METRICS_UPDATE', data });
    } catch (err) {
      console.error('[AdsOptimizer] Erro no polling:', err);
    }
  }
});

// Heartbeat
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_STATE') {
    sendResponse({ accessToken: !!accessToken, adAccountId });
  }
  if (msg.type === 'GET_METRICS') {
    chrome.storage.session.get('latestMetrics', (result) => {
      sendResponse(result.latestMetrics || null);
    });
    return true; // async response
  }
});
