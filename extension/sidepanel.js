// Ads Optimizer Pro — Side Panel Script

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Check initial state
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
  if (response?.accessToken) {
    setLiveMode();
  } else {
    setDemoMode();
  }
});

// Listen for updates from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TOKEN_CAPTURED') {
    setLiveMode();
  }
  if (msg.type === 'METRICS_UPDATE' && msg.data?.data?.[0]) {
    updateMetrics(msg.data.data[0]);
  }
});

function setLiveMode() {
  statusDot.className = 'status-dot live';
  statusText.textContent = 'Live';
}

function setDemoMode() {
  statusDot.className = 'status-dot demo';
  statusText.textContent = 'Demo';
}

function updateMetrics(data) {
  const spend = parseFloat(data.spend || '0');
  const ctr = parseFloat(data.ctr || '0');
  const cpm = parseFloat(data.cpm || '0');
  const cpc = parseFloat(data.cpc || '0');

  const purchases = data.actions?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase');
  const conversions = parseInt(purchases?.value || '0');
  const cpa = conversions > 0 ? spend / conversions : 0;
  const roas = spend > 0 ? (conversions * cpa * 3.5) / spend : 0;

  document.getElementById('metricCPA').textContent = `R$ ${cpa.toFixed(2)}`;
  document.getElementById('metricROAS').textContent = `${roas.toFixed(2)}x`;
  document.getElementById('metricCTR').textContent = `${ctr.toFixed(2)}%`;
  document.getElementById('metricSpend').textContent = `R$ ${spend.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
}

// Action buttons
document.getElementById('btnRefresh')?.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'GET_METRICS' }, (data) => {
    if (data?.data?.[0]) updateMetrics(data.data[0]);
  });
});

document.getElementById('btnScale')?.addEventListener('click', () => {
  window.open('https://ads-optimizer-pro.vercel.app', '_blank');
});

document.getElementById('btnPause')?.addEventListener('click', () => {
  window.open('https://ads-optimizer-pro.vercel.app', '_blank');
});
