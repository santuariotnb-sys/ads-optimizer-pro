// Ads Optimizer Pro — Background Service Worker (sidePanel architecture)

let accessToken = null;
let adAccountId = null;
const API_VERSION = 'v21.0';

// Open sidePanel when clicking the extension icon
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Enable sidePanel only on Ads Manager pages
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  try {
    const url = new URL(tab.url);
    const isAdsManager = url.hostname.includes('facebook.com') && url.pathname.includes('adsmanager');
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'sidepanel.html',
      enabled: isAdsManager,
    });
  } catch {
    // Ignore invalid URLs
  }
});

// Capture tokens from Graph API requests
chrome.webRequest?.onBeforeSendHeaders?.addListener(
  (details) => {
    try {
      const url = new URL(details.url);
      const token = url.searchParams.get('access_token');
      if (token && token !== accessToken) {
        accessToken = token;
        chrome.storage.session.set({ accessToken: token });
        chrome.runtime.sendMessage({ type: 'TOKEN_CAPTURED', token }).catch(() => {});
      }

      const accountMatch = details.url.match(/act_(\d+)/);
      if (accountMatch && accountMatch[1] !== adAccountId) {
        adAccountId = accountMatch[1];
        chrome.storage.session.set({ adAccountId });
      }
    } catch {
      // Ignore parse errors
    }
  },
  { urls: ['https://graph.facebook.com/*'] },
  ['requestHeaders']
);

// Polling metrics every 5 minutes
chrome.alarms?.create('metricsPoll', { periodInMinutes: 5 });

chrome.alarms?.onAlarm?.addListener(async (alarm) => {
  if (alarm.name === 'metricsPoll' && accessToken && adAccountId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${API_VERSION}/act_${adAccountId}/insights?fields=cpc,cpm,ctr,spend,actions&date_preset=last_7d&access_token=${accessToken}`
      );
      const data = await response.json();
      chrome.storage.session.set({ latestMetrics: data });
      chrome.runtime.sendMessage({ type: 'METRICS_UPDATE', data }).catch(() => {});
    } catch (err) {
      console.error('[AdsOptimizer] Erro no polling:', err);
    }
  }
});

// Message handler for sidePanel communication
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_STATE') {
    sendResponse({ accessToken: !!accessToken, adAccountId });
  }
  if (msg.type === 'GET_METRICS') {
    chrome.storage.session.get('latestMetrics', (result) => {
      sendResponse(result.latestMetrics || null);
    });
    return true;
  }
});
