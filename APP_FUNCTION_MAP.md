# APP FUNCTION MAP — Ads Optimizer Pro (Ads.Everest)

> Generated: 2026-03-29
> Every button, input, API call, store connection, and Supabase call in the entire app.

---

## App.tsx (src/App.tsx)
Store: [currentModule, mode, accessToken, adAccountId, campaigns, adSets, ads, creatives, audiences, alerts, metrics, emqScore, signalAudit, isLoading, currentWorkspace] / [setCampaigns, setAdSets, setAds, setCreatives, setAudiences, setAlerts, setMetrics, setEMQScore, setSignalAudit, setIsLoading, setAccessToken, setCurrentModule]
Supabase: [campaign_metrics (upsert), alerts (upsert), auth.getUser()]

### Navigation / Routing
- No React Router. Uses `currentModule` store field + `ModuleRouter` switch/case.
- Three main tabs: COMANDO (cmd-*), XTRACKER (trace-*), CRIATIVOS (cre-*)
- SubNav items defined as static arrays (comandoNav, traceNav, creativeNav)

### API Calls
- `parseCallbackToken()` → extracts Meta OAuth token from URL hash — REAL
- `MetaApiService.fetchCampaigns()` → Meta Graph API v21.0 — REAL (live mode only)
- `MetaApiService.fetchAudiences()` → Meta Graph API v21.0 — REAL (live mode only)
- `MetaApiService.fetchInsights()` → per-campaign insights — REAL (live mode only)
- `evaluateAlerts(campaigns, emq)` → generates alerts from thresholds — REAL (pure logic)
- `supabase.from('campaign_metrics').upsert()` → persists campaign data — REAL (fire-and-forget, fails silently)
- `supabase.from('alerts').upsert()` → persists dynamic alerts — REAL (fire-and-forget, fails silently)

### Effects
- Sets default module to `cmd-overview` on first load
- In demo mode: loads all mock data from `mockData.ts`
- In live mode: fetches from Meta API, enriches with insights, persists to Supabase
- Shows OnboardingWizard when `mode=live && !currentWorkspace && currentModule='cmd-onboarding'`

### Issues
- In live mode alert evaluation, accesses `useStore.getState().campaigns` inside async flow (race condition possible)
- Mock alerts always merged with dynamic alerts even in live mode: `setAlerts([...mockAlerts, ...dynamicAlerts])`

---

## TopNav (src/components/Layout/TopNav.tsx)
Store: [currentModule] / [setCurrentModule]
Supabase: [auth.getUser() — fetches user name]

### Buttons
- Logo click → `setCurrentModule('cmd-overview')` — REAL
- "COMANDO" tab → `setCurrentModule('cmd-overview')` — REAL
- "XTRACKER" tab → `setCurrentModule('trace-dashboard')` — REAL
- "CRIATIVOS" tab → `setCurrentModule('cre-dashboard')` — REAL
- Bell icon → `alert('Nenhuma notificacao nova')` — PLACEHOLDER
- User avatar → `setCurrentModule('cmd-settings')` — REAL
- Mobile menu toggle → toggles `mobileMenuOpen` state — REAL

### Issues
- Bell notification is a browser `alert()`, not connected to any notification system
- User name fetched from Supabase auth on mount, fails silently

---

## SubNav (src/components/Layout/SubNav.tsx)
Store: [currentModule] / [setCurrentModule]
Supabase: none

### Buttons
- Each nav item → `setCurrentModule(item.id)` — REAL

---

## CommandBar (src/components/Layout/CommandBar.tsx)
Store: [currentModule] / [setCurrentModule]
Supabase: none

### Buttons
- "Comando" → `setCurrentModule('cmd-overview')` — REAL
- "XTracker" → `setCurrentModule('trace-dashboard')` — REAL
- "UTMs" → `setCurrentModule('trace-utms')` — REAL
- "Criativos" → `setCurrentModule('cre-dashboard')` — REAL
- Live clock updates every second — REAL (local time)

---

## Landing (src/pages/Landing.tsx)
Store: none
Supabase: none

### Buttons
- CTAButton components → scroll to `#section` or `window.open(href)` — REAL (anchor links / external)
- "Ver Features" / "Comecar Gratis" buttons → scroll to sections — REAL

### Issues
- Standalone landing page, no store connection, no auth
- All data is hardcoded for marketing display

---

## Overview (src/components/Overview/Overview.tsx)
Store: [theme, campaigns, metrics, emqScore, mode] / [setCurrentModule]
Supabase: none (indirect via store)

### Buttons
- "Gerar Relatorio Semanal" → calls Anthropic API directly with campaign data — REAL (requires API key in sessionStorage)
- Campaign row clicks → `setCurrentModule('cmd-campaigns')` — REAL
- KPI cards display animated count-up values — REAL (display only)

### API Calls
- Anthropic Messages API (claude-sonnet-4-20250514) → generates weekly report — REAL (direct browser call with `anthropic-dangerous-direct-browser-access`)

### Inputs/Forms
- None

### Issues
- API key retrieved from sessionStorage or env var, no UI to set it from this component
- Falls back to mock data when store is empty and mode=demo

---

## Dashboard (src/components/Dashboard/Dashboard.tsx)
Store: [selectedPeriod, campaigns, metrics, mode] / [setSelectedPeriod]
Supabase: none

### Buttons
- "Hoje" / "7d" / "14d" / "30d" period buttons → `setSelectedPeriod(p)` — REAL (changes period filter, but NO re-fetch happens)

### Issues
- Period buttons update store but don't trigger any data re-fetch
- Metric cards and campaign table are display-only
- Falls back to mock data

---

## Campaigns (src/components/Campaigns/Campaigns.tsx)
Store: [campaigns, mode] / none
Supabase: none

### Buttons
- Campaign card header (click) → toggles expand/collapse to show ad sets — REAL (local state)
- "Copiar ID" button on ad sets → `navigator.clipboard.writeText()` + `showToast()` — REAL
- "Pausar" button on ad sets → `showToast('info', '...')` — PLACEHOLDER (shows toast but doesn't actually pause)

### Inputs/Forms
- Search input → filters campaigns by name (local state) — CONNECTED

### Issues
- "Pausar" button does NOT call Meta API, just shows a toast
- Ad sets always come from `mockAdSetsData`, never from live data

---

## UTMTracking (src/components/UTMTracking/UTMTracking.tsx)
Store: [currentModule, campaigns] / none
Supabase: [sales (read via fetchSales)]

### Buttons
- "Exportar" → generates CSV from current view data and downloads — REAL
- "Atualizar" → `showToast('info', 'Dados atualizados')` — PLACEHOLDER (no actual refresh)

### Inputs/Forms
- Periodo select → filters sales data period, triggers Supabase fetch — CONNECTED
- Produto select → local filter state — DISCONNECTED (no actual filtering of table data)
- Conta select → local filter state — DISCONNECTED (no actual filtering)

### API Calls
- `fetchSales(period)` → Supabase `sales` table — REAL (falls back to mock VENDAS_DATA on error)

### Issues
- "Atualizar" button just shows toast, doesn't re-fetch
- Produto and Conta filters have onChange but don't filter the displayed data
- UTM and Relatorio views use hardcoded mock data (UTM_DATA, RELATORIO_DATA), never real
- Campaign data merges store campaigns with hardcoded CAMPANHAS_DATA

---

## TraceSummary (src/components/TraceSummary/TraceSummary.tsx)
Store: [metrics] / none
Supabase: [sales (read via getSalesSummary)]

### Buttons
- "Atualizar" → re-fetches sales summary from Supabase — REAL

### Inputs/Forms
- Period filter select → triggers data re-fetch — CONNECTED
- "Conta de Anuncio", "Fonte de Trafego", "Plataforma", "Produto" filters → `onChange={() => {}}` — DISCONNECTED (no-op)

### API Calls
- `getSalesSummary(period)` → Supabase `sales` table — REAL (falls back to MOCK_SUMMARY)

### Issues
- 4 out of 5 filter selects are no-ops (empty onChange)
- Several metric cards show hardcoded zeros (Custos de Produto, Despesas adicionais, etc.)
- Match rate between webhook sales and Meta conversions is displayed but purely calculated from available data

---

## PlatformAds (src/components/PlatformAds/PlatformAds.tsx)
Store: none (uses useIsMobile only)
Supabase: none

### Buttons
- Sub-tab buttons (Contas/Campanhas/Conjuntos/Anuncios) → switches view — REAL (local state)

### Inputs/Forms
- Search input → local state only — DISCONNECTED (no filtering implemented)
- Period select → local state only — DISCONNECTED
- "Colunas" select → local state only — DISCONNECTED

### Issues
- COMPLETELY EMPTY tables — shows "0 CAMPANHAS" / "0 CONTAS" etc. with all zeroed values
- No data fetching at all — no API calls, no store reads for actual data
- Supports Meta, Google, TikTok, Kwai but none have real data connections
- Pure UI shell with no functionality

---

## Integrations (src/components/Integrations/Integrations.tsx)
Store: [theme] / none
Supabase: none (direct)

### Tabs
- Anuncios, Webhooks, UTMs, Pixel, WhatsApp, Testes

### Buttons — Anuncios tab
- Platform cards (Meta/Google/TikTok/Kwai) expand → "Adicionar perfil" — REAL for Meta (redirects to Facebook OAuth), PLACEHOLDER for others (shows notice "sera disponibilizada em breve")

### Buttons — Webhooks tab
- "Adicionar Webhook" → creates local webhook entry + copies Supabase URL to clipboard — REAL
- "Adicionar Credencial" → opens modal, creates local credential entry — REAL (local state only, not persisted)

### Buttons — UTMs tab
- "Copiar Link" → validates utm_source/utm_medium, copies generated URL — REAL
- "Limpar" → clears all UTM fields — REAL
- UTM template preset buttons → fills source/medium — REAL
- "Ver opcoes" on platform UTM codes → opens modal with copy — REAL

### Buttons — Pixel tab
- "Adicionar Pixel" → opens drawer with pixel config form — REAL (local state only)
- Pixel toggle (on/off) → local state toggle — DISCONNECTED (not persisted)

### Buttons — WhatsApp tab
- "Conectar" → shows notice "em breve" — PLACEHOLDER

### Buttons — Testes tab
- "Gerar Link de Teste" → builds test URL from fields — REAL (generates URL, copies to clipboard)

### Modals
- Credential creation modal (triggered by "Adicionar Credencial")
- UTM code modal (triggered by "Ver opcoes" on platform codes)
- Pixel drawer (triggered by "Adicionar Pixel")

### Inputs/Forms — UTMs tab
- URL input, utm_source*, utm_medium*, utm_campaign, utm_content, utm_term → builds UTM URL — CONNECTED

### Issues
- Webhooks, credentials, pixels are LOCAL STATE ONLY — lost on page refresh
- No Supabase persistence for any integration data in this component
- WhatsApp integration is placeholder
- Google, TikTok, Kwai ad connections all show "em breve"

---

## Creatives (src/components/Creatives/Creatives.tsx)
Store: [mode] / none (uses mockCreativesData directly)
Supabase: none

### Buttons
- Filter pills (Todos/Vencedor/Testando/Perdedor) → filters creative cards — REAL (local state)
- Sort buttons (Score/CPA/Hook Rate) → sorts creative cards — REAL (local state)

### Inputs/Forms
- None

### Issues
- Always uses `mockCreativesData`, never real data even in live mode
- No API calls whatsoever
- Creative cards are display-only, no actions (no pause, no edit, no duplicate)
- EntityIDMap sub-component also uses mock data only

---

## CreativeVision (src/components/CreativeVision/CreativeVision.tsx)
Store: [none read] / [setCreativeAnalysisContext, setCurrentModule]
Supabase: none

### Buttons
- "Selecionar Arquivo" → opens file picker — REAL
- "Analisar Criativo" → sends frames to Claude or OpenAI for analysis — REAL
- "Gerar Plano de Acao" → sends analysis results back to AI for action plan — REAL
- "Discutir com Apex" → sets analysis context in store + navigates to Agent — REAL
- "Historico" → shows localStorage analysis history — REAL
- "Comparar" → enables compare mode between two analyses — REAL
- Provider toggle (Claude/OpenAI) → switches AI provider — REAL

### Inputs/Forms
- API Key input → stored in sessionStorage — CONNECTED
- File upload (drag & drop + click) → processes image/video — CONNECTED

### API Calls
- `analyzeCreative(frames, apiKey, type)` → Anthropic Messages API — REAL
- `analyzeCreativeOpenAI(frames, apiKey, type)` → OpenAI API — REAL
- Action plan generation → Anthropic/OpenAI API — REAL

### Issues
- API key stored in sessionStorage (per-tab, cleared on close) — intentional security choice
- localStorage used for analysis history (up to 20 entries)
- Video frame extraction can fail with non-H.264 codecs

---

## SignalEngine (src/components/SignalEngine/SignalEngine.tsx)
Store: [mode, emqScore] / none
Supabase: none

### Buttons
- "Copiar" on CAPI payload → copies JSON to clipboard — REAL
- "Enviar Evento de Teste" → simulated send (setTimeout 500ms, no actual API call) — PLACEHOLDER

### Sub-components
- EMQMonitorAdvanced, EventLogPanel, ValueRulesPanel, TrackingScriptPanel, FunnelBuilder

### Issues
- All data from `mockCAPIState`, `mockCAPIEvent`, `mockFunnelConfig`
- "Enviar Evento de Teste" is simulated, doesn't actually send anything
- Signal level computed from mock state

---

## SignalGateway (src/components/SignalGateway/SignalGateway.tsx)
Store: [mode (via getState)] / none
Supabase: [gateway_events (read), funnels (read/write)]

### Tabs
- Dashboard, Configurar Funil, Script da LP

### Buttons
- Tab switches (Dashboard/Funnel/Script) → local state — REAL
- "Salvar Funil" → `saveFunnelConfig(funnel)` → Supabase upsert — REAL
- "Copiar Script" → generates tracking script, copies to clipboard — REAL
- "Enviar Evento de Teste" → POST to `${SUPABASE_URL}/functions/v1/collect` — REAL

### Inputs/Forms — Funnel tab
- funnel_name, funnel_type, front_price, bump prices/rates, upsell/downsell, pixel_id, capi_token — all CONNECTED to funnel state

### API Calls
- `fetchGatewayStats('7d')` → Supabase `gateway_events` — REAL (falls back to MOCK_STATS)
- `fetchGatewayPipeline('7d')` → Supabase `gateway_events` — REAL (falls back to MOCK_PIPELINE)
- `fetchFunnelConfig()` → Supabase `funnels` — REAL
- `saveFunnelConfig(funnel)` → Supabase `funnels` upsert — REAL
- `sendTestEvent()` → Supabase Edge Function `/collect` — REAL

### Issues
- Falls back to mock data when Supabase returns empty/zero data in demo mode

---

## SignalAudit (src/components/SignalAudit/SignalAudit.tsx)
Store: [signalAudit] / none
Supabase: none

### Buttons
- Pillar cards (click) → toggles expand/collapse to show details — REAL (local state)

### Issues
- Shows "Conecte sua conta Meta" message when signalAudit is null
- Data comes entirely from store (loaded from mockSignalAudit in demo mode in App.tsx)
- No API calls, no write operations
- Display-only component

---

## AutoScale (src/components/AutoScale/AutoScale.tsx)
Store: [campaigns, accessToken, adAccountId, mode] / none
Supabase: [alert_rules (read/write)]

### Buttons
- Rule toggle switches → toggles rule on/off, persists to Supabase for real DB rows — REAL
- "Executar" on pending actions → calls Meta API to update budget or pause — REAL (live mode) / marks as executed (demo mode)

### API Calls
- `fetchAlertRules()` → Supabase `alert_rules` table — REAL (falls back to MOCK_RULES)
- `supabase.from('alert_rules').update()` → persists toggle state — REAL (only for UUID rows)
- `evaluateAutoScale(campaigns, cpaTarget)` → pure logic, generates scale actions — REAL
- `MetaApiService.updateBudget()` → Meta Graph API — REAL (live mode only)
- `MetaApiService.updateStatus()` → Meta Graph API — REAL (live mode only)

### Issues
- Stats cards ("Acoes esta semana", "Budget otimizado") are HARDCODED — not from real data
- CPA target is hardcoded at R$50
- Activity log is hardcoded mock data

---

## Agent (src/components/Agent/Agent.tsx)
Store: [metrics, campaigns, emqScore, creativeAnalysisContext] / [setCreativeAnalysisContext]
Supabase: none

### Buttons
- Quick topic pills (6 topics: Visao Geral, Estrategia de Lances, etc.) → sends predefined question — REAL
- Send button → sends user message — REAL
- Cancel button (bridge mode) → cancels active streaming task — REAL

### Inputs/Forms
- Chat input (textarea) → user message — CONNECTED

### API Calls
- **Bridge mode**: `localBridge.sendTask()` → streams response from local Claude Code CLI — REAL
- **API mode**: `AIAgent.sendMessage()` → Anthropic Messages API (claude-sonnet-4-20250514) — REAL
- **Demo mode**: returns canned responses from `demoResponses` object — MOCK

### Connection modes (auto-detected)
1. `bridge` — Local Claude Code CLI running (checks `localBridge.getStatus()`)
2. `api` — Anthropic API key available (sessionStorage or env var)
3. `demo` — Fallback with hardcoded expert responses

### Issues
- In demo mode, responses are canned text, not AI-generated
- API key needs to be set in CreativeVision or sessionStorage manually
- Creative analysis context injected from store when navigating from CreativeVision

---

## Pipeline (src/components/Pipeline/Pipeline.tsx)
Store: none
Supabase: none

### Buttons
- Pipeline stage cards (Andromeda/GEM/Leilao) → toggles expand/collapse — REAL (local state)

### Issues
- PURELY EDUCATIONAL/INFORMATIONAL component
- All data is hardcoded (Meta algorithm pipeline explanation)
- No interactions beyond expand/collapse
- No API calls, no store, no Supabase

---

## Playbook (src/components/Playbook/Playbook.tsx)
Store: none
Supabase: none

### Buttons
- Category filter tabs (Todos/Criativos/CAPI/Campanhas/Algoritmo) → filters entries — REAL (local state)
- Entry cards (click) → toggles expand/collapse — REAL (local state)

### Issues
- PURELY EDUCATIONAL component (knowledge base)
- All 10 entries are hardcoded
- No API calls, no store, no Supabase

---

## Financial (src/components/Financial/Financial.tsx)
Store: [theme, mode, selectedPeriod, metrics] / none
Supabase: [sales (read), expenses (read/write), monthly_dre (read)]

### Buttons
- "Adicionar Despesa" → opens expense form — REAL
- "Salvar" (expense form) → creates expense in Supabase (live) or local state (demo) — REAL
- Delete expense (trash icon) → deletes from Supabase (live) or local state (demo) — REAL

### Inputs/Forms
- Expense form: category, description, amount, is_recurring, reference_date — CONNECTED

### API Calls
- `getSalesSummary(period)` → Supabase `sales` table — REAL
- `fetchExpenses(month)` → Supabase `expenses` table — REAL
- `createExpense(input)` → Supabase `expenses` insert — REAL
- `deleteExpense(id)` → Supabase `expenses` delete — REAL
- `fetchMonthlyDRE()` → Supabase `monthly_dre` view — REAL

### Issues
- Falls back to MOCK_SUMMARY and MOCK_EXPENSES in demo mode
- Monthly DRE may be empty if Supabase view not configured

---

## Alerts (src/components/Alerts/Alerts.tsx)
Store: [mode, alerts] / [dismissAlert]
Supabase: none (indirect via store)

### Buttons
- Severity filter tabs (Todos/Criticos/Avisos/Info/Sucesso) → filters alerts — REAL
- Dismiss button (X) on each alert → marks as dismissed in local state + store — REAL

### Issues
- Uses mock alerts when mode=demo, store alerts otherwise
- Dismissal is in-memory only (not persisted to Supabase from this component)

---

## Audiences (src/components/Audiences/Audiences.tsx)
Store: none (uses mockAudiences directly)
Supabase: none

### Buttons
- None (display-only cards)

### Issues
- ALWAYS uses `mockAudiences` — never real data, even in live mode
- No store connection for audiences data
- Overlap detection is calculated from mock data
- Consolidation banner shows warnings but no action buttons

---

## Settings (src/components/Settings/Settings.tsx)
Store: [theme, mode] / none
Supabase: [integrations (read/write), webhook_logs (read), profiles (read/write), auth.getUser()]

### Tabs
- Integracoes, Webhook/API, Geral, Notificacoes, Assinatura

### Buttons — Integracoes tab
- "Conectar" per provider → Meta: OAuth redirect, Others: `upsertIntegration()` — REAL
- "Copiar" webhook URL → clipboard — REAL
- Show/hide token toggle → local state — REAL

### Buttons — Webhook tab
- "Copiar" webhook URL → clipboard — REAL
- "Testar" webhook → Supabase Edge Function call — REAL

### Buttons — Geral tab
- "Salvar" profile → Supabase `profiles` update — REAL

### Buttons — Notificacoes tab
- Channel toggles (In-App/Email/WhatsApp/Telegram) → local state — PARTIALLY CONNECTED
- Push notification toggle → `subscribeToPush()` / `unsubscribeFromPush()` — REAL

### Buttons — Assinatura tab
- SubscriptionTab sub-component (plan management)

### Inputs/Forms — Geral tab
- Timezone, Currency, ROAS target, CPA target, Closing day — CONNECTED to Supabase profiles

### API Calls
- `getIntegrations()` → Supabase `integrations` — REAL
- `upsertIntegration()` → Supabase `integrations` upsert — REAL
- `getWebhookStats()` → Supabase `webhook_logs` — REAL
- `supabase.from('profiles').select/update()` — REAL
- `subscribeToPush()` → browser Push API + Supabase `push_subscriptions` — REAL

### Issues
- In demo mode, all Supabase calls fail silently
- Email/WhatsApp/Telegram notifications are toggle-only, no actual implementation

---

## CampaignCreator (src/components/CampaignCreator/CampaignCreator.tsx)
Store: [accessToken, adAccountId, mode] / [setAdAccountId]
Supabase: none

### Buttons
- "Proximo" / "Voltar" (step navigation) — REAL
- "Usar Defaults Recomendados" → fills form with recommended values — REAL
- "Criar Campanha" → submits campaign to Meta API — REAL (live mode only)

### Inputs/Forms
- Step 0: Campaign name, objective, bid strategy, daily budget, special categories — CONNECTED
- Step 1: Countries, age range, gender, optimization goal, attribution window, placements — CONNECTED
- Step 2: Ad name, creative file upload, page selection — CONNECTED
- Campaign mode toggle (new/existing) — CONNECTED
- Ad set mode toggle (new/existing) — CONNECTED
- Ad account selector — CONNECTED
- Page selector — CONNECTED

### API Calls
- `MetaApiService.fetchAdAccounts()` → Meta Graph API — REAL
- `MetaApiService.fetchPagesWithPicture()` → Meta Graph API — REAL
- `MetaApiService.fetchCampaignsList()` → Meta Graph API — REAL
- `MetaApiService.fetchAdSetsList()` → Meta Graph API — REAL
- `MetaApiService.createCampaign()` → Meta Graph API — REAL
- `MetaApiService.createAdSet()` → Meta Graph API — REAL
- `MetaApiService.createAd()` → Meta Graph API — REAL
- `MetaApiService.uploadImage()` → Meta Graph API — REAL

### Issues
- In demo mode, shows form but cannot submit (no accessToken)
- All campaigns created as PAUSED by default (safety measure)

---

## OnboardingWizard (src/components/Onboarding/OnboardingWizard.tsx)
Store: [workspaces] / [setCurrentWorkspace, setWorkspaces, setOnboardingStep, setCurrentModule]
Supabase: [workspaces (write via createWorkspace)]

### Buttons
- "Proximo" / "Voltar" step navigation — REAL
- "Criar Workspace" (final step) → creates workspace in Supabase — REAL

### Inputs/Forms
- Step 0 (Projeto): name*, domain*, checkout domain, business type — CONNECTED
- Step 1 (Eventos): event toggles (PageView/ViewContent/Lead/etc.), synthetic event toggles — CONNECTED
- Step 2 (Destinos): pixel IDs (Meta/Google/TikTok), webhook URL, CAPI toggle + token — CONNECTED

### API Calls
- `createWorkspace(insert)` → Supabase `workspaces` insert — REAL

### Issues
- user_id is hardcoded as 'demo-user' in the insert payload
- After creation, navigates to cmd-overview

---

# SERVICES

---

## metaApi.ts (src/services/metaApi.ts)
- Wrapper for Meta Graph API v21.0
- Cache: 5min TTL (in-memory Map)
- Rate limiting: 200 requests/hour
- Methods: fetchCampaigns, fetchAdSets, fetchAds, fetchInsights, fetchCreatives, fetchAudiences, fetchAdAccounts, fetchPagesWithPicture, fetchCampaignsList, fetchAdSetsList, fetchAdsList, duplicateAd, createCampaign, createAdSet, uploadImage, createAd, updateBudget, updateStatus
- ALL methods are REAL Meta Graph API calls (no mocks in this service)

## metaAuth.ts (src/services/metaAuth.ts)
- `getMetaLoginUrl()` → builds OAuth URL — REAL
- `openMetaLogin()` → redirects to Facebook OAuth — REAL
- `parseCallbackToken()` → extracts access_token from URL hash — REAL

## aiAgent.ts (src/services/aiAgent.ts)
- `AIAgent.sendMessage()` → calls Anthropic Messages API (claude-sonnet-4-20250514) — REAL
- Uses `anthropic-dangerous-direct-browser-access` header
- System prompt includes live campaign metrics from context

## alertEngine.ts (src/services/alertEngine.ts)
- `evaluateAlerts(campaigns, emqScore)` → generates alerts based on thresholds — REAL (pure logic)
- Checks: ROAS < 1, CTR < 1%, CPA spike (+25%), CPM fatigue (+30%), frequency > 3, learning phase > 14d, EMQ thresholds, winner detection

## autoScaler.ts (src/services/autoScaler.ts)
- `evaluateAutoScale(campaigns, cpaTarget)` → generates scale actions — REAL (pure logic)
- Rules: scale up (+10% budget) when CPA < target, pause when CPA > 2x target, pause when CTR < 1% with < 5 conversions
- Enforces: 7-day minimum before decisions, 48h cooldown between adjustments

## entityDetector.ts (src/services/entityDetector.ts)
- `analyzeCreativeSimilarity()` → groups creatives by Entity ID — REAL (pure logic)
- `calculateVisualSimilarity()` → simplified hash comparison — REAL
- `getOvercrowdedEntities()` → entities with >3 creatives — REAL
- `suggestDiversification()` → generates suggestions — REAL

## creativeVision.ts (src/services/creativeVision.ts)
- `analyzeCreative(frames, apiKey, type)` → Anthropic API with vision — REAL
- `analyzeCreativeOpenAI(frames, apiKey, type)` → OpenAI API with vision — REAL
- `extractVideoFrames()` → extracts strategic frames from video element — REAL
- `imageToFrame()` → converts image to FrameData — REAL

## gatewayService.ts (src/services/gatewayService.ts)
- `fetchGatewayStats()` → Supabase `gateway_events` — REAL
- `fetchGatewayPipeline()` → Supabase `gateway_events` aggregation — REAL
- `fetchFunnelConfig()` → Supabase `funnels` — REAL
- `saveFunnelConfig()` → Supabase `funnels` upsert — REAL
- `calculateEPV()` → pure math — REAL
- `generateTrackingScript()` → generates JS snippet — REAL

## salesService.ts (src/services/salesService.ts)
- `fetchSales(period, filters)` → Supabase `sales` — REAL
- `getSalesSummary(period)` → Supabase `sales` aggregation — REAL
- `getSalesByDay(period)` → Supabase `sales` grouped by day — REAL
- `getUTMBreakdown()` → Supabase `utm_ranking` view — REAL

## expenseService.ts (src/services/expenseService.ts)
- `fetchExpenses(month)` → Supabase `expenses` — REAL
- `createExpense(input)` → Supabase `expenses` insert (requires auth) — REAL
- `updateExpense(id, input)` → Supabase `expenses` update — REAL
- `deleteExpense(id)` → Supabase `expenses` delete — REAL
- `getExpenseSummary(month)` → aggregation — REAL

## integrationService.ts (src/services/integrationService.ts)
- `getIntegrations()` → Supabase `integrations` — REAL
- `upsertIntegration()` → Supabase `integrations` upsert (requires auth) — REAL
- `deleteIntegration()` → Supabase `integrations` delete — REAL
- `toggleIntegration()` → Supabase `integrations` update — REAL
- `getWebhookUrl()` → builds webhook URL — REAL
- `getWebhookStats()` → Supabase `webhook_logs` — REAL

## workspaceService.ts (src/services/workspaceService.ts)
- `createWorkspace()` → Supabase `workspaces` insert — REAL
- `getWorkspaces()` → Supabase `workspaces` select — REAL
- `getWorkspace(id)` → Supabase `workspaces` single — REAL
- `updateWorkspace()` → Supabase `workspaces` update — REAL
- `generateTrackingScript()` → generates full JS tracking snippet — REAL

## pushNotifications.ts (src/services/pushNotifications.ts)
- `isPushSupported()` → checks browser support — REAL
- `subscribeToPush()` → browser Push API + Supabase `push_subscriptions` upsert — REAL
- `unsubscribeFromPush()` → unsubscribe + Supabase delete — REAL

## capi/tracking.ts (src/services/capi/tracking.ts)
- `generateTrackingScript(config, rules)` → generates Signal Engine v5 tracking JS — REAL
- `generateInstallSnippet(config)` → generates simple script tag — REAL
- Features: UTM capture, _fbp/_fbc cookies, scroll/time/video tracking, synthetic event rules, CAPI-compliant payloads, sendBeacon delivery

---

# SUPABASE TABLES USED

| Table | Read | Write | Components |
|-------|------|-------|------------|
| `campaign_metrics` | - | upsert | App.tsx |
| `alerts` | - | upsert | App.tsx |
| `alert_rules` | select | update | AutoScale |
| `sales` | select | - | UTMTracking, TraceSummary, Financial |
| `expenses` | select | insert/update/delete | Financial |
| `monthly_dre` | select | - | Financial |
| `gateway_events` | select | - | SignalGateway |
| `funnels` | select | upsert | SignalGateway |
| `integrations` | select | upsert/delete/update | Settings |
| `webhook_logs` | select | - | Settings |
| `profiles` | select | update | Settings |
| `workspaces` | select | insert/update | OnboardingWizard, workspaceService |
| `push_subscriptions` | - | upsert/delete | pushNotifications |
| `utm_ranking` (view) | select | - | salesService |

---

# CRITICAL ISSUES SUMMARY

1. **PlatformAds** — Complete UI shell with ZERO data. Google, TikTok, Kwai, and even Meta sub-tabs show empty tables.
2. **Audiences** — Always uses `mockAudiences`, never real data. Store has `setAudiences` but Audiences component ignores it.
3. **Creatives** — Always uses `mockCreativesData`. No connection to store creatives.
4. **UTMTracking "Atualizar"** — Placeholder button, just shows toast.
5. **Campaigns "Pausar"** — Placeholder, shows toast but never calls Meta API.
6. **TopNav Bell** — Browser `alert()` instead of real notification system.
7. **Dashboard period buttons** — Changes store value but triggers no data re-fetch.
8. **TraceSummary filters** — 4 of 5 filter selects are no-ops.
9. **SignalEngine "Enviar Evento"** — Simulated with setTimeout, no actual API call.
10. **Integrations** — All webhook/credential/pixel data is local state only, lost on refresh.
11. **AutoScale stats** — "Acoes esta semana" and "Budget otimizado" are hardcoded.
12. **OnboardingWizard** — user_id hardcoded as 'demo-user'.
13. **Agent demo mode** — Returns canned text, not AI-generated responses.
14. **Pipeline/Playbook** — Educational-only, no interactive functionality.
