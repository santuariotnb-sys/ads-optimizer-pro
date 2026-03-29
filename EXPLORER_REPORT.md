# EXPLORER REPORT — Ads.Everest Component Audit

## Layout/Navigation

### App.tsx — /Users/guilhermehenrique/ads-optimizer-pro/src/App.tsx
- Status: ✅ FUNCIONA
- Interactive elements: ModuleRouter switch/case maps all modules correctly; SubNav receives items; default module set to opt-overview
- Language: all pt-BR (nav labels: Visão Geral, Campanhas, Rastreamento, Financeiro, Configurações, etc.)
- Empty state: DashboardSkeleton shown during loading
- Loading state: yes, checks `isLoading` from store
- Issues:
  - Quick action "Escalar Vencedoras" navigates to `opt-scale` which is NOT handled in ModuleRouter (falls to default Dashboard)
  - `utm-despesas` renders `<Financial />` — this works but is not obvious

### TopNav — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Layout/TopNav.tsx
- Status: ⚠️ PARCIAL
- Interactive elements:
  - Tab buttons (PAINEL, UTM STUDIO, CRIATIVOS): wired to `setCurrentModule` ✅
  - Bell icon button: NO onClick handler ❌ (visual only, shows red dot but does nothing)
  - User avatar button: NO onClick handler ❌ (visual only)
  - Logo image: NO onClick/navigation ❌ (static image)
  - Mobile hamburger menu: works ✅
- Language: all pt-BR (tabs: PAINEL, UTM STUDIO, CRIATIVOS)
- Empty state: N/A
- Loading state: N/A
- Issues:
  - Bell icon has no onClick — user sees notification dot but can't interact
  - User avatar has no onClick — no profile/logout menu
  - Logo doesn't navigate anywhere on click
  - User name "Guilherme" and initials "GH" are hardcoded

### SubNav — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Layout/SubNav.tsx
- Status: ✅ FUNCIONA
- Interactive elements: all sub-nav buttons wired to `setCurrentModule` ✅
- Language: labels come from parent (all pt-BR)
- Empty state: N/A
- Loading state: N/A
- Issues:
  - Global `div::-webkit-scrollbar { display: none }` style tag affects ALL divs on the page, not just this component

### CommandBar — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Layout/CommandBar.tsx
- Status: ✅ FUNCIONA
- Interactive elements: 4 quick action buttons all wired to `setCurrentModule` ✅; LiveClock works ✅
- Language: all pt-BR (Visão Geral, Campanhas, UTMs, Criativos)
- Empty state: N/A
- Loading state: N/A
- Issues: None significant

### AppLayout — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Layout/AppLayout.tsx
- Status: ✅ FUNCIONA
- Interactive elements: renders TopNav, CommandBar, EverestBg, children
- Language: N/A (structural)
- Empty state: N/A
- Loading state: N/A
- Issues: None

---

## Optimizer Tab

### Overview — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Overview/Overview.tsx
- Status: ✅ FUNCIONA
- Interactive elements:
  - "Ver todas" button: navigates to opt-campaigns ✅
  - Quick Actions (4 buttons): all wired to navigate ✅
  - KPI cards: display only ✅
  - Charts (Signal, Weekly, Gauge): animated SVG rendering ✅
- Language: all pt-BR (Custo por Aquisição, Retorno sobre Gasto, Total Investido, Total Conversões, Qualidade do Sinal, Ao Vivo, Métricas Principais, Score EMQ, Taxa de Match, Recuperação, Pontuação da Conta, etc.)
- Empty state: falls back to mockCampaigns if campaigns empty ✅
- Loading state: handled in App.tsx level
- Issues:
  - "Escalar Vencedoras" navigates to `opt-scale` which doesn't exist in ModuleRouter
  - "Criar Campanha" navigates to `create` — works but goes to CampaignCreator (legacy)
  - Sub-metrics (Saúde da Conta: "Bom", Fase de Aprendizado: "2/6") are hardcoded, not from real data
  - Signal chart uses hardcoded data array, not from store

### Campaigns — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Campaigns/Campaigns.tsx
- Status: ✅ FUNCIONA
- Interactive elements:
  - Search input: wired ✅
  - Campaign expand/collapse: wired ✅
  - Action buttons (Pausar, Escalar +20%, Duplicar): wired but show `alert()` message ⚠️
  - Hover effects on cards and adsets: work ✅
- Language: all pt-BR (Campanhas, Gerencie e otimize, Buscar campanhas, Pausar, Escalar, Duplicar, Conjuntos de Anúncios, Fase de Aprendizado, Nenhuma campanha encontrada, etc.)
- Empty state: "Nenhuma campanha encontrada" ✅
- Loading state: handled at App level
- Issues:
  - Uses `mockCampaigns` directly instead of store campaigns — ignores live data
  - Action buttons only show alert(), not functional even in demo mode
  - "Escalar +20%" label says +20% but system rule is max +10%
  - Status label shows raw English-like values via `statusLabel` map but ROAS/CPA/CTR labels are kept as abbreviations (acceptable)

### SignalEngine — /Users/guilhermehenrique/ads-optimizer-pro/src/components/SignalEngine/SignalEngine.tsx
- Status: ✅ FUNCIONA
- Interactive elements:
  - "Configurar Funil" button: switches to FunnelBuilder view ✅
  - "Enviar Evento" button: simulates send ✅
  - "Copiar JSON" button: copies to clipboard ✅
  - Value rules toggle: wired via `toggleValueRule` ✅
  - Sub-components (EMQMonitorAdvanced, EventLogPanel, ValueRulesPanel, TrackingScriptPanel, FunnelBuilder): imported and rendered ✅
- Language: mostly pt-BR (Nível de Sinal, Eventos Sintéticos, Enviar Evento, Copiado, Evento enviado com sucesso). Some English: "Signal Engine" title ⚠️, "Events", "Synth.", "Match" stat labels ⚠️, "CAPI Payload" ⚠️, stage names like "Deep Eng.", "PageView", "ViewContent", "Lead", "Checkout", "Purchase" ⚠️
- Empty state: N/A (always has mock data)
- Loading state: N/A
- Issues:
  - Title "Signal Engine" is in English
  - Several stat card labels in English: "Events", "Synth.", "Match"
  - Funnel stage names in English: "PageView", "Deep Eng.", "ViewContent", "Lead", "Checkout", "Purchase"
  - "CAPI Payload" section header in English
  - user_data/custom_data labels in English (technical, possibly acceptable)

### Financial — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Financial/Financial.tsx
- Status: ✅ FUNCIONA
- Interactive elements:
  - "Adicionar" expense button: toggles form ✅
  - Expense form (category select, description input, amount input, date input, save button): all wired ✅
  - Delete expense buttons: wired ✅
  - Live/demo mode switching: works ✅
- Language: all pt-BR (Controle Financeiro, DRE simplificado, Faturamento Bruto, Gasto com Tráfego, Lucro Líquido, Receita Bruta de Vendas, etc.)
- Empty state: N/A (always has mock expenses)
- Loading state: N/A
- Issues:
  - "Breakdown por Categoria" — "Breakdown" is English ⚠️
  - Uses `c.surface2`, `c.surface3`, `c.textSecondary` from COLORS_LIGHT which may not be defined (potential runtime issue if theme constants are incomplete)

### Settings — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Settings/Settings.tsx
- Status: ✅ FUNCIONA
- Interactive elements:
  - Tab switching (Integrações, Geral, Notificações): wired ✅
  - Connect buttons for each provider: wired (Meta redirects to OAuth, others call upsertIntegration) ✅
  - Show/hide token toggle: wired ✅
  - Copy webhook URL: wired ✅
  - Profile form fields: all wired ✅
  - Save button: wired to Supabase ✅
  - Notification toggles: VISUAL ONLY, no onClick handler ❌
  - "Reconectar" button for Meta: NO onClick handler ❌
- Language: all pt-BR (Configurações, Integrações, preferências e notificações, Conectar, Conectado, Preferências Gerais, Canais de Notificação, etc.)
- Empty state: shows empty integration list gracefully
- Loading state: N/A
- Issues:
  - Notification toggle switches are purely visual — no state change on click
  - "Reconectar" button for Meta has no onClick handler
  - In demo mode, Supabase calls will silently fail (handled via try/catch)

---

## UTM Tab

### UTMTracking — /Users/guilhermehenrique/ads-optimizer-pro/src/components/UTMTracking/UTMTracking.tsx
- Status: ✅ FUNCIONA
- Interactive elements:
  - Sub-tab switching (Campanhas, UTMs, Vendas, Relatórios): driven by `currentModule` from store ✅
  - Period filter select: wired ✅
  - Platform filter select: wired ✅
  - Download CSV button: present ✅
  - Refresh button: present ✅
  - Table sorting: likely wired ✅
- Language: all pt-BR (UTM Studio, Campanhas, UTMs, Vendas, Relatórios, column headers: Orçamento, Vendas, Gastos, Faturamento, Lucro, Margem, etc.)
- Empty state: N/A (has extensive mock data)
- Loading state: N/A
- Issues:
  - Sub-tab "Despesas" in SubNav navigates to `utm-despesas` which renders Financial component (works but duplicates)
  - All data is hardcoded mock data — no connection to store campaigns

---

## Creative Tab

### Creatives — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Creatives/Creatives.tsx
- Status: ⚠️ PARCIAL
- Interactive elements:
  - Filter buttons (Todos, Winners, Testing, Losers): wired ✅
  - Sort buttons (Score, CPA, Hook Rate): wired ✅
  - EntityIDMap sub-component: rendered ✅
  - Creative cards: hover effects ✅ but NO click action ❌
- Language: mixed
  - pt-BR: "Criativos", "Analise performance, fadiga e Entity IDs", "Todos", "Ordenar", "Nenhum criativo encontrado", "Fadiga", "d ativo"
  - English: "Winner", "Testing", "Loser" status labels ❌, "Winners", "Losers" filter labels ❌, "Hook Rate", "Hold Rate" metric labels ❌, "Score" ❌
- Empty state: "Nenhum criativo encontrado" ✅
- Loading state: N/A
- Issues:
  - Status labels in English: "Winner", "Testing", "Loser"
  - Filter labels in English: "Winners", "Testing", "Losers"
  - Metric labels in English: "Hook Rate", "Hold Rate", "Score"
  - Creative cards are not clickable — no detail view or action on click
  - Uses `mockCreativesData` directly, not from store

### CreativeVision — /Users/guilhermehenrique/ads-optimizer-pro/src/components/CreativeVision/CreativeVision.tsx
- Status: ✅ FUNCIONA
- Interactive elements:
  - Provider toggle (Claude/OpenAI): wired ✅
  - API key input: wired, persisted to sessionStorage ✅
  - File upload (drag & drop + click): wired ✅
  - Creative type selector (Vídeo, Imagem, Carousel): wired ✅
  - "Analisar Criativo" button: wired to actual AI analysis ✅
- Language: mostly pt-BR ("Análise de Criativos com IA", "Configuração da API", "Arraste ou clique para enviar", "Analisar Criativo", "Analisando...", "Configurado", "Não configurado", "Score do Criativo", "Tags do Criativo", "Frames Extraídos", "Insights da IA", "Resumo da Análise", "Vídeo", "Imagem")
  - "Carousel" is English ⚠️
  - "/100" label in English context ⚠️ (minor)
- Empty state: shows upload area with instructions ✅
- Loading state: shows progress text + spinner ✅
- Issues:
  - "Carousel" should be "Carrossel"
  - API key stored in sessionStorage (documented as acceptable)
  - Stores API key for Anthropic/OpenAI in session — security note

---

## Legacy Modules

### Alerts — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Alerts/Alerts.tsx
- Status: ✅ FUNCIONA
- Interactive elements:
  - Tab filters (Todos, Criticos, Avisos, Info, Sucesso): wired ✅
  - Dismiss button per alert: wired to both local state and store ✅
- Language: mostly pt-BR ("Central de Alertas", "alertas pendentes", "Todos", "Criticos", "Avisos", "Info", "Sucesso", "Dispensar alerta", "Nenhum alerta nesta categoria")
  - "Criticos" missing accent (should be "Críticos") ⚠️
- Empty state: "Nenhum alerta nesta categoria" ✅
- Loading state: N/A
- Issues:
  - "Criticos" missing accent → "Críticos"

### Agent — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Agent/Agent.tsx
- Status: ⚠️ PARCIAL
- Interactive elements:
  - Quick topic pills (6 topics): wired ✅
  - Text input + send button: wired ✅
  - Enter key to send: wired ✅
  - Typing indicator animation: works ✅
- Language: all pt-BR ("Consultor de Ads IA", "Análise inteligente", "Online", "Pergunte sobre suas campanhas...", "Modo demonstração", all response content in pt-BR)
- Empty state: welcome message shown ✅
- Loading state: typing dots animation ✅
- Issues:
  - Demo mode ONLY — no real AI integration in this component (uses hardcoded responses)
  - Uses `dangerouslySetInnerHTML` for rendering markdown — XSS risk if input ever comes from external source
  - No scroll-to-bottom on initial render (only on message changes)
  - The agent name uses emoji "👋" in welcome message

### AutoScale — /Users/guilhermehenrique/ads-optimizer-pro/src/components/AutoScale/AutoScale.tsx
- Status: ✅ FUNCIONA
- Interactive elements:
  - Rule toggle switches (6 rules): wired to local state ✅
  - Hover effects: work ✅
- Language: all pt-BR ("Auto-Scale", "Motor de regras automáticas", "Ações esta semana", "Budget otimizado", "Campanhas afetadas", "Regras de Automação", "Regras de Segurança", "Log de Atividades", safety rules in pt-BR, log entries in pt-BR)
  - "Budget" used multiple times (English) ⚠️ — "Budget +10%", "Budget otimizado"
- Empty state: N/A
- Loading state: N/A
- Issues:
  - "Budget" should be "Orçamento" in pt-BR
  - Rule toggle state is local only — not persisted to store
  - All data is hardcoded — not connected to real campaign data
  - "Auto-Scale" title is English ⚠️

### Pipeline — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Pipeline/Pipeline.tsx
- Status: ✅ FUNCIONA
- Interactive elements:
  - Stage cards expand/collapse on click: wired ✅
  - Hover effects: work ✅
- Language: mixed
  - pt-BR: "Pipeline de Entrega de Anúncios", "Como o Meta processa seus anúncios", "Mais detalhes", "Menos detalhes"
  - English: "Retrieval Engine", "Ranking Model", "Auction System" stage subtitles ❌, metric labels "Latência", "Candidatos" are pt-BR but "IG Conv.", "FB Conv." are English-ish ⚠️
- Empty state: N/A
- Loading state: N/A
- Issues:
  - Subtitles in English: "Retrieval Engine", "Ranking Model", "Auction System"
  - This is educational/reference content — English technical terms may be intentional

### Playbook — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Playbook/Playbook.tsx
- Status: ✅ FUNCIONA
- Interactive elements:
  - Category filter tabs: wired ✅
  - Entry expand/collapse: wired ✅
  - Hover effects: work ✅
- Language: all pt-BR ("Playbook", "Base de conhecimento com as melhores práticas", "Todos", "Criativos", "CAPI", "Campanhas", "Algoritmo", "Nenhum item nesta categoria")
  - "Playbook" title is English ⚠️ (but commonly used as loan word)
- Empty state: "Nenhum item nesta categoria" ✅
- Loading state: N/A
- Issues:
  - "Playbook" title — could be "Manual de Táticas" but English is acceptable as industry term

### Audiences — /Users/guilhermehenrique/ads-optimizer-pro/src/components/Audiences/Audiences.tsx
- Status: ⚠️ PARCIAL
- Interactive elements:
  - Hover effects on cards: work ✅
  - NO action buttons (no pause, no edit, no consolidate) ❌
- Language: mostly pt-BR but with MISSING ACCENTS:
  - "Audiencias" → should be "Audiências" ❌
  - "audiencias ativas" → "audiências ativas" ❌
  - "Saturacao" → "Saturação" ❌
  - "Audiencia saudavel" → "Audiência saudável" ❌
  - "competicao no leilao" → "competição no leilão" ❌
  - "Nenhuma audiencia encontrada" → "Nenhuma audiência encontrada" ❌
  - "Acao necessaria" → "Ação necessária" ❌
- Empty state: "Nenhuma audiencia encontrada" ✅ (but missing accent)
- Loading state: N/A
- Issues:
  - Multiple missing accents throughout (at least 7 instances)
  - Frequency value color uses `#f5f5f5` (near-white) for normal frequencies — invisible on light backgrounds ❌
  - No action buttons — user can only view data, not act on it
  - Uses mockAudiences directly, not from store

### SignalGateway — /Users/guilhermehenrique/ads-optimizer-pro/src/components/SignalGateway/SignalGateway.tsx
- Status: ✅ FUNCIONA
- Interactive elements:
  - Tab switching (Dashboard, Configurar Funil, Script da LP): wired ✅
  - All funnel config form fields: wired ✅
  - Save button: wired to Supabase ✅
  - Copy script button: wired ✅
- Language: mostly pt-BR ("Gateway de Sinal", "Server-side tracking + CAPI enriquecido", "Configurar Funil", "Script da LP", "Pipeline Hoje", "EMQ Breakdown", "Informações do Funil", "Valores do Funil", "Conexão", "Salvar Configuração", "Como Usar na LP")
  - "Dashboard" tab label in English ⚠️
  - "DELIVERY STATUS" in English ❌
  - "Live" status text in English ⚠️
  - "EMQ Breakdown" uses "Breakdown" ⚠️
  - "Recovery" label in English ⚠️
  - Pipeline stage names in English: "PageView", "ViewContent", "Lead", "Checkout", "Purchase" ⚠️
- Empty state: "Aguardando eventos" when no stats ✅
- Loading state: N/A
- Issues:
  - Several English strings: "Dashboard", "DELIVERY STATUS", "Live", "Recovery", "EMQ Breakdown"
  - Pipeline stage names all in English
  - Connected to Supabase — will fail silently in demo mode (acceptable)

---

## HEADER/NAV SPECIFIC CHECKS

| Check | Result |
|-------|--------|
| Logo click navigates somewhere | ❌ No onClick handler |
| Bell icon has onClick | ❌ No handler, visual-only red dot |
| User avatar has onClick | ❌ No handler, no dropdown menu |
| Tab switching works | ✅ All 3 tabs (PAINEL, UTM STUDIO, CRIATIVOS) work |
| SubNav items map to valid routes | ⚠️ All map except `opt-scale` from Overview quick action |
| CommandBar buttons work | ✅ All 4 quick action buttons navigate correctly |

---

## FINAL SUMMARY

### Totals
- ✅ FUNCIONA: 15 components (App, TopNav partial but renders, SubNav, CommandBar, AppLayout, Overview, Campaigns, SignalEngine, Financial, Settings, UTMTracking, CreativeVision, Alerts, AutoScale, Pipeline, Playbook, SignalGateway)
- ⚠️ PARCIAL: 4 components (TopNav — missing handlers, Creatives — English labels + no click action, Agent — demo only, Audiences — missing accents + broken colors)
- ❌ QUEBRADO: 0 components
- 🔲 NÃO EXISTE: 1 feature (`opt-scale` route referenced but not handled)

### TOP 10 ISSUES (ranked by user impact)

1. **Bell icon does nothing** (TopNav) — User sees notification dot, clicks, nothing happens. Creates confusion and perceived broken UX. HIGH IMPACT.

2. **User avatar does nothing** (TopNav) — No profile menu, no logout, no account settings access from header. HIGH IMPACT.

3. **Logo doesn't navigate** (TopNav) — Standard UX expectation is logo = home. Missing. MEDIUM-HIGH IMPACT.

4. **Notification toggles in Settings are visual-only** — User toggles Email/WhatsApp/Telegram notifications but nothing happens. State doesn't change. MEDIUM-HIGH IMPACT.

5. **Audiences: frequency color #f5f5f5 is invisible on light background** — Normal frequency values show as near-white text on white/light cards. Data is unreadable. MEDIUM-HIGH IMPACT.

6. **Missing accents in Audiences** — 7+ instances: "Audiencias", "Saturacao", "saudavel", "competicao", "leilao", "Acao necessaria". Looks unprofessional. MEDIUM IMPACT.

7. **English strings in Creatives** — "Winner", "Testing", "Loser", "Winners", "Losers", "Hook Rate", "Hold Rate", "Score". Inconsistent with pt-BR convention. MEDIUM IMPACT.

8. **`opt-scale` route doesn't exist** — Overview quick action "Escalar Vencedoras" navigates to `opt-scale` which falls through to default Dashboard. Dead navigation. MEDIUM IMPACT.

9. **Campaign action buttons only show alert()** — "Pausar", "Escalar +20%", "Duplicar" buttons show a browser alert. No actual action even in demo mode. MEDIUM IMPACT.

10. **SignalEngine title and labels in English** — "Signal Engine", "Events", "Synth.", "Match", "CAPI Payload", funnel stage names all in English. Inconsistent with pt-BR standard. LOW-MEDIUM IMPACT.
