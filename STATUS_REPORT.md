# Status Report — Ads Everest
Data: 2026-03-29

## Build: PASS
- Vite 8, 2230 modules, 344ms
- 0 erros TypeScript, 0 warnings
- Bundle total: ~367 KB JS + 24 KB CSS (gzip: ~117 KB JS + 5.7 KB CSS)
- Todos os lazy chunks gerados corretamente (18 route-level chunks)

---

## Navegacao

### TopNav (3 tabs)
| Tab | Label | Default Module |
|-----|-------|----------------|
| opt | PAINEL | opt-overview |
| utm | UTM STUDIO | utm-campanhas |
| cre | CRIATIVOS | cre-dashboard |

### SubNav por Tab

**PAINEL (opt)**
| Item | Modulo |
|------|--------|
| Visao Geral | opt-overview |
| Campanhas | opt-campaigns |
| Rastreamento | opt-signal |
| Financeiro | opt-financial |
| Configuracoes | opt-settings |

**UTM STUDIO (utm)**
| Item | Modulo |
|------|--------|
| Campanhas | utm-campanhas |
| UTMs | utm-utms |
| Vendas | utm-vendas |
| Despesas | utm-despesas |
| Relatorios | utm-relatorios |
| Facebook | meta-campanhas |
| Google | google-campanhas |
| TikTok | tiktok-campanhas |
| Kwai | kwai-campanhas |
| Integracoes | integ-dashboard |

**CRIATIVOS (cre)**
| Item | Modulo |
|------|--------|
| Criativos | cre-dashboard |
| Analise IA | cre-vision |

### ModuleRouter — Todas as rotas
| Modulo(s) | Componente | Observacao |
|-----------|-----------|------------|
| opt-overview | Overview | Default na carga |
| dashboard | Dashboard | Legacy fallback |
| opt-campaigns, campaigns | Campaigns | |
| opt-signal, signal, opt-gateway, gateway, opt-audit, signalaudit | SignalEngine | Consolida Signal/Gateway/Audit |
| opt-financial, financial, utm-despesas | Financial | |
| opt-settings, settings | Settings | |
| utm-campanhas, utm-utms, utm-vendas, utm-relatorios, utm-dashboard, utm-sources, utm-links, utm-sales, utm-webhooks, utm | UTMTracking | |
| cre-dashboard, cre-analysis, cre-compare, cre-upload, creatives, cre-entity | Creatives | |
| cre-vision | CreativeVision | |
| meta-contas/campanhas/conjuntos/anuncios | PlatformAds (meta) | |
| google-contas/campanhas/conjuntos/anuncios | PlatformAds (google) | |
| tiktok-contas/campanhas/conjuntos/anuncios | PlatformAds (tiktok) | |
| kwai-contas/campanhas/conjuntos/anuncios | PlatformAds (kwai) | |
| integ-dashboard, integ-webhooks, integ-utms, integ-pixel, integ-whatsapp, integ-testes | Integrations | |
| audiences | Audiences | Legacy, sem SubNav |
| alerts | Alerts | Legacy, sem SubNav |
| agent | Agent | Legacy, sem SubNav |
| pipeline | Pipeline | Legacy, sem SubNav |
| create | CampaignCreator | Legacy, sem SubNav |
| opt-scale, autoscale | AutoScale | Legacy, sem SubNav |
| playbook | Playbook | Legacy, sem SubNav |

---

## Modulos (18 unicos renderizados)

| # | Modulo | Status | Data Source | Issues |
|---|--------|--------|-------------|--------|
| 1 | Overview | OK | Store com fallback mock | Dados hardcoded nos sub-cards (Taxa Match 89%, Recuperacao +34%) |
| 2 | Dashboard | OK | Store com fallback mock | `useStore.getState()` chamado diretamente no onClick (anti-pattern menor) |
| 3 | Campaigns | OK | Store com fallback mock | AdSets sempre de mockAdSetsData, nao do store |
| 4 | UTMTracking | OK | 100% mock (inline) | 4 sub-views: campanhas, utms, vendas, relatorios. Tudo hardcoded |
| 5 | PlatformAds | OK | Nenhum dado real | Tabela mostra apenas empty state com zeros. 4 plataformas (Meta, Google, TikTok, Kwai) |
| 6 | Integrations | OK | Nenhum dado real | 6 sub-tabs: anuncios, webhooks, utms, pixel, whatsapp, testes. Usa COLORS/COLORS_LIGHT (tema dark/light) |
| 7 | Creatives | OK | mockCreativesData | Cards, filtros (all/winner/testing/loser), sort (score/cpa/hook_rate), EntityIDMap |
| 8 | CreativeVision | OK | Upload + IA (Claude/OpenAI) | Funcional via API key do usuario. FFmpeg para video frames |
| 9 | SignalEngine | OK | capiMockData | EMQ Monitor, Event Log, Value Rules, Tracking Script, Funnel Builder |
| 10 | Financial | OK | Supabase com fallback mock | Sales (Supabase), Expenses (Supabase), DRE mensal. Funciona em modo demo com mocks |
| 11 | AutoScale | OK | Supabase com fallback mock | 6 regras mock. Busca alert_rules do Supabase se disponivel |
| 12 | Agent | OK | Anthropic API (claude-sonnet-4-20250514) | Chat com demo responses hardcoded. Modo live usa API real |
| 13 | Settings | OK | Supabase (modo live) | 3 tabs: integrations, general, notifications. Push notifications via VAPID |
| 14 | Alerts | OK | Store (mockAlerts) | Filtro por severidade (critical/warning/info/success) |
| 15 | Playbook | OK | Hardcoded (10 entries) | Categorias: Criativos, CAPI, Campanhas, Algoritmo. Sem persistencia |
| 16 | Audiences | OK | Store (mockAudiences) | Legacy, nao acessivel via SubNav |
| 17 | Pipeline | OK | Mock | Legacy, nao acessivel via SubNav |
| 18 | CampaignCreator | OK | Mock | Legacy, nao acessivel via SubNav |

### Componentes Orfaos (existem mas nao sao importados no App)
| Componente | Arquivo | Nota |
|-----------|---------|------|
| SignalGateway | src/components/SignalGateway/SignalGateway.tsx | Nao importado em nenhum lugar. Codigo morto |
| SignalAudit | src/components/SignalAudit/SignalAudit.tsx | Nao importado em nenhum lugar. Codigo morto (dados mock usados no store, mas componente nunca renderizado) |

---

## Services (14 arquivos)

| # | Service | Usado por | Conexao | Issues |
|---|---------|-----------|---------|--------|
| 1 | metaApi.ts | App.tsx (modo live) | Meta Graph API v21.0 | OK. Cache 5min, rate limit 200/h |
| 2 | metaAuth.ts | App.tsx | Meta OAuth | OK |
| 3 | aiAgent.ts | Agent.tsx | Anthropic API | OK. Usa claude-sonnet-4-20250514 |
| 4 | alertEngine.ts | Nenhum componente | Puro (sem API) | NAO UTILIZADO diretamente por componentes. Testado em __tests__ |
| 5 | autoScaler.ts | Nenhum componente | Puro (sem API) | NAO UTILIZADO diretamente por componentes. Logica existe mas nao ha trigger |
| 6 | entityDetector.ts | Nenhum componente | Puro (sem API) | NAO UTILIZADO diretamente. Testado em __tests__ |
| 7 | creativeVision.ts | CreativeVision.tsx | Claude/OpenAI Vision API | OK. 2 console.warn (fallback FFmpeg, aceitavel) |
| 8 | salesService.ts | Financial.tsx | Supabase | OK |
| 9 | expenseService.ts | Financial.tsx | Supabase | OK |
| 10 | integrationService.ts | Settings.tsx | Supabase | OK |
| 11 | gatewayService.ts | SignalGateway.tsx | Supabase | ORFAO — SignalGateway nao e renderizado |
| 12 | pushNotifications.ts | Settings.tsx (via hook) | Supabase + Web Push | OK |
| 13 | capi/* (6 arquivos) | SignalEngine sub-components | Supabase + Meta CAPI | OK |

---

## Consistencia Visual

### Design Pattern
- **Megamorphism/Alpine** (light glassmorphism): padrao dominante. Backgrounds `rgba(255,255,255,0.34)`, blur, white borders
- **AlpineCard**: Usado em Overview, CreativeVision, SignalEngine, AutoScale, Financial e sub-componentes
- **glass-card CSS class**: Usado em Integrations, Alerts, Playbook, SignalGateway
- **tilt-card CSS class**: Usado em Campaigns, SignalEngine, AutoScale, Audiences
- **Inline glass styles**: Dashboard, PlatformAds, UTMTracking usam inline ao inves de classes

### Fontes (4 familias em uso)
| Fonte | Uso | Cobertura |
|-------|-----|-----------|
| Plus Jakarta Sans | TopNav, SubNav, Logo | Apenas navegacao |
| Outfit | Body, labels, headings | Maioria dos componentes |
| Space Grotesk | Numeros grandes, metricas | Overview, Integrations, SignalEngine, Financial, Playbook |
| JetBrains Mono | Dados tabulares, codigo | Dashboard, PlatformAds, Integrations |

**Nota**: CLAUDE.md documenta Outfit como fonte principal, mas TopNav/SubNav usam Plus Jakarta Sans. Nao ha conflito visual, mas ha divergencia da documentacao.

### Inconsistencias Detectadas
1. **Integrations.tsx** usa `COLORS`/`COLORS_LIGHT` do constants (suporta tema dark), enquanto todos os outros componentes usam cores inline hardcoded para o tema light megamorphism. Se o tema mudar, so Integrations e Settings adaptam.
2. **PlatformAds** usa neumorphism (box-shadow com light/dark shadows) diferente do glassmorphism dos demais.

---

## Problemas Encontrados

### Criticos (0)
Nenhum.

### Importantes (3)
1. **SignalGateway e SignalAudit sao codigo morto** — Componentes existem mas nunca sao importados/renderizados. gatewayService.ts tambem e orfao por consequencia.
2. **alertEngine.ts, autoScaler.ts, entityDetector.ts nao sao consumidos** — Services com logica pronta mas nenhum componente os chama. Apenas testes existem.
3. **6 modulos legacy sem acesso via SubNav** — Audiences, Alerts, Agent, Pipeline, CampaignCreator, Playbook so sao acessiveis via CommandBar ou navegacao programatica (ex: botoes de acao rapida). Usuario nao consegue descobrir essas funcionalidades pela navegacao principal.

### Menores (5)
4. **Dados hardcoded no Overview** — Taxa de Match (89%), Recuperacao (+34%), deltas de KPI sao fixos, nao refletem dados reais.
5. **Campaigns.tsx** sempre busca adSets do mock, mesmo quando store tem dados live.
6. **UTMTracking 100% mock** — Nao usa store nem Supabase. 4 views validas mas SubNav lista mais (utm-despesas redireciona para Financial).
7. **PlatformAds** mostra apenas empty state com zeros — nao ha integracao real com nenhuma plataforma alem do Meta.
8. **console.warn** em creativeVision.ts (2 ocorrencias) — aceitavel pois sao fallbacks de FFmpeg.

### Boas Praticas
- 0 TODO/FIXME/HACK encontrados
- 0 API keys ou secrets hardcoded (todas via env vars ou input do usuario)
- 0 console.log em producao (apenas 2 console.warn aceitaveis)
- TypeScript strict mode sem erros
- Lazy loading em todos os modulos
- Testes unitarios para alertEngine e entityDetector

---

## Score Geral: 7.5/10

**Justificativa:**
- (+) Build limpo, zero erros TS, zero warnings
- (+) Arquitetura solida: lazy loading, Zustand, code splitting
- (+) Design visual coeso (megamorphism Alpine)
- (+) Supabase integrado em Financial, AutoScale, Settings
- (+) Zero secrets expostos, zero console.log
- (-) 2 componentes orfaos + 3 services nao consumidos = codigo morto
- (-) 6 modulos inacessiveis pela navegacao principal
- (-) Maioria dos modulos ainda 100% mock data
- (-) Pequenas inconsistencias de tema (Integrations/Settings vs resto)
