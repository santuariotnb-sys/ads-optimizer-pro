════════════════════════════════════════════════════════════
RELATÓRIO DE ANÁLISE — SISTEMA UTM (Ads Everest vs UTMify)
Data: 2026-03-29
════════════════════════════════════════════════════════════

STACK DETECTADA:
  Frontend: React 19 + Vite 8 + TypeScript 5.9 (strict) + Tailwind CSS v4 + Zustand v5 + Motion (Framer) + Recharts + Lucide React
  Backend:  Supabase (Auth, DB, Edge Functions, Storage) + Vercel (hosting)
  Banco:    PostgreSQL (Supabase) — Tabelas: profiles, integrations, sales, campaigns, campaign_metrics, expenses, alerts, alert_rules, webhook_logs
  Views:    sales_summary, monthly_dre, utm_ranking

════════════════════════════════════════════════════════════
SEÇÃO 1 — O QUE EXISTE NO ADS EVEREST
════════════════════════════════════════════════════════════

 #  Módulo               Arquivo Principal                                              Status
────────────────────────────────────────────────────────────────────────────────────────────────
 1  Overview             src/components/Overview/Overview.tsx                            COMPLETA — 4 KPIs, gráfico de sinal, gauge de conta, campanhas top, ações rápidas
 2  Dashboard            src/components/Dashboard/Dashboard.tsx                          COMPLETA — 8 MetricCards (CPA, ROAS, CTR, CPM, MER, Spend, Conv, Score), tabela de campanhas
 3  Campanhas            src/components/Campaigns/Campaigns.tsx                          COMPLETA — Lista com expand, ad sets, busca, ações (pausar/escalar/duplicar), learning phase
 4  UTM Tracking         src/components/UTMTracking/UTMTracking.tsx                      COMPLETA — 4 sub-tabs: Campanhas (15 cols), UTMs (15 cols), Vendas, Relatórios. Export CSV, filtros
 5  Criativos            src/components/Creatives/Creatives.tsx                          COMPLETA — Cards com score, hook/hold rate, fadiga CPM, Entity ID, filtros, sort
 6  Creative Vision      src/components/CreativeVision/CreativeVision.tsx                COMPLETA — Upload + análise IA (Claude/OpenAI), extração de frames, score, insights
 7  Signal Engine        src/components/SignalEngine/SignalEngine.tsx                     COMPLETA — 5 níveis CAPI, EMQ Monitor, Event Log, Value Rules, Tracking Script, Funnel Builder
 8  Signal Gateway       src/components/SignalGateway/SignalGateway.tsx                   COMPLETA — Pipeline de eventos, configuração de funil, métricas de delivery
 9  Signal Audit         src/components/SignalAudit/SignalAudit.tsx                       COMPLETA — 8 pilares, gauge de maturidade/risco, Red Line Checklist
10  Alertas              src/components/Alerts/Alerts.tsx                                COMPLETA — Filtros por severidade, dismiss, contadores
11  Auto-Scale           src/components/AutoScale/AutoScale.tsx                          COMPLETA — 6 regras automáticas, toggle on/off, activity log, safety rules
12  Públicos             src/components/Audiences/Audiences.tsx                          COMPLETA — Saturation gauge, overlap, CPA por público
13  Pipeline             src/components/Pipeline/Pipeline.tsx                            COMPLETA — Andromeda → GEM → Auction → Delivery (educacional)
14  Agente IA            src/components/Agent/Agent.tsx                                  PARCIAL — Chat com respostas demo hardcoded, sem integração real com Anthropic em produção
15  Criar Campanha       src/components/CampaignCreator/CampaignCreator.tsx              PARCIAL — Wizard multi-step, mas ações são placeholder (só funciona em modo demo)
16  Playbook             src/components/Playbook/Playbook.tsx                            COMPLETA — 10 entries educacionais, filtro por categoria, expandível
17  Financeiro           src/components/Financial/Financial.tsx                           COMPLETA — Resumo de vendas, despesas CRUD, DRE simplificado, integração Supabase
18  Configurações        src/components/Settings/Settings.tsx                            COMPLETA — Integrações (UTMify/Meta/Hotmart/Kiwify/Monetizze), Webhook URL, Notificações Push, Perfil
19  Layout/TopNav        src/components/Layout/TopNav.tsx                                COMPLETA — 3 tabs (Painel, UTM Studio, Criativos), mobile hamburger
20  Layout/SubNav        src/components/Layout/SubNav.tsx                                COMPLETA — Sub-navegação contextual por tab
21  Layout/CommandBar    src/components/Layout/CommandBar.tsx                             COMPLETA — Barra de comando estilo Spotlight

SERVICES:
  - metaApi.ts — Graph API v21.0, cache 5min, rate limit 200/h
  - metaAuth.ts — OAuth callback parser
  - alertEngine.ts — Avaliação de alertas baseada em thresholds
  - autoScaler.ts — Motor de auto-scale com regra 10%/48h
  - entityDetector.ts — Agrupamento por Entity ID, detecção de overcrowding
  - aiAgent.ts — Integração Anthropic API
  - creativeVision.ts — Análise visual IA (Claude + OpenAI), extração de frames via FFmpeg
  - gatewayService.ts — Signal Gateway com cálculo EPV, stats, pipeline
  - salesService.ts — CRUD vendas, resumo, breakdown UTM via Supabase
  - expenseService.ts — CRUD despesas com categorias
  - integrationService.ts — CRUD integrações + webhook stats
  - pushNotifications.ts — Web Push via Service Worker + VAPID

════════════════════════════════════════════════════════════
SEÇÃO 2 — COMPARAÇÃO TELA A TELA COM UTMify
════════════════════════════════════════════════════════════

───── 2.1 TELAS PRINCIPAIS ─────

 #  Tela UTMify                   Status    Notas Ads Everest
─────────────────────────────────────────────────────────────
 1  Resumo (Dashboard)            ⚠️ PARCIAL  Tem dashboard com 8 métricas + overview. MAS faltam métricas financeiras detalhadas (ver 2.2)
 2  Meta Ads (Contas/Camp/Conj)   ⚠️ PARCIAL  Tem campanhas + conjuntos. Faltam: sub-tab Contas, sub-tab Anúncios individual, seleção de conta
 3  Google Ads                    ❌ AUSENTE  Nenhuma integração Google Ads
 4  Kwai Ads                      ❌ AUSENTE  Nenhuma integração Kwai Ads
 5  TikTok Ads                    ❌ AUSENTE  Nenhuma integração TikTok Ads
 6  UTMs                          ✅ EXISTE   UTM Tracking com tabela de 15 colunas, dados mock completos
 7  Integrações                   ⚠️ PARCIAL  Sub-tab Anúncios + Webhooks OK. Faltam: sub-tab UTMs config, Pixel config, WhatsApp, Testes
 8  Regras (Automação)            ⚠️ PARCIAL  Auto-Scale tem 6 regras pré-definidas. Falta: CRUD de regras custom, config de condições/ações/frequência dinâmicas
 9  Taxas                         ❌ AUSENTE  Não há tela dedicada para impostos, taxas adicionais, custo de produto por item
10  Despesas                      ✅ EXISTE   Financial tem CRUD de despesas com categorias, recorrência, integração Supabase
11  Relatórios                    ⚠️ PARCIAL  UTM Tracking tem sub-tab Relatórios com 10 cols. Faltam: Despesas, IC no relatório diário
12  Notificações                  ⚠️ PARCIAL  Push notifications implementado (VAPID + SW). Faltam: config por tipo (vendas/relatórios), schedule (08/12/18/23h), templates
13  Assinatura                    ❌ AUSENTE  Nenhuma tela de planos, billing, usage limits
14  Minha Conta                   ⚠️ PARCIAL  Settings tem perfil (timezone, currency, targets). Faltam: password change, 2FA, language selector
15  Avançado                      ❌ AUSENTE  Sem multi-dashboard, sem MCP integration, sem Colaboradores
16  Suporte                       ❌ AUSENTE  Sem tela de tutoriais, WhatsApp, community links
17  Aplicativo                    ❌ AUSENTE  Sem tela de download Android/iOS

───── 2.2 MÉTRICAS DO DASHBOARD UTMify ─────

 Métrica UTMify                   Status    Notas
──────────────────────────────────────────────────
 Faturamento Bruto               ✅ SIM     Financial: grossRevenue
 Faturamento Líquido             ✅ SIM     Financial: netRevenue
 Gastos                          ✅ SIM     metrics.spend
 ROAS                            ✅ SIM     metrics.roas
 Lucro                           ✅ SIM     Financial: lucro calculado
 Vendas por Produto              ❌ NÃO     Não há breakdown por produto no dashboard
 Vendas Pendentes                ✅ SIM     Financial: pendingSales
 ROI                             ⚠️ PARCIAL UTM Tracking tem ROI, mas dashboard principal não
 Custos de Produto               ❌ NÃO     Sem custo por produto individual
 Vendas Reembolsadas             ✅ SIM     Financial: refundedSales + refundedAmount
 Margem                          ⚠️ PARCIAL UTM Tracking tem margem, mas dashboard principal não
 Despesas adicionais             ✅ SIM     Financial: expenses
 Imposto sobre vendas            ❌ NÃO     Sem cálculo de impostos automático
 Imposto total                   ❌ NÃO     Sem totalização de impostos
 Reembolso (valor)               ✅ SIM     Financial: refundedAmount
 Taxas (plataforma)              ⚠️ PARCIAL monthly_dre view tem taxas_plataforma, mas sem UI dedicada
 Chargeback                      ❌ NÃO     Sem tracking de chargeback
 Imposto Meta Ads                ❌ NÃO     Sem cálculo específico
 Vendas por Fonte                ⚠️ PARCIAL utm_ranking view existe, mas sem gráfico no dashboard
 Taxa de Aprovação (Cartão/Pix)  ❌ NÃO     Sem breakdown por método de pagamento
 Vendas por Pagamento (pizza)    ❌ NÃO     Sem gráfico pizza de pagamentos
 CPA                             ✅ SIM     metrics.cpa
 CTR                             ✅ SIM     metrics.ctr
 CPM                             ✅ SIM     metrics.cpm
 MER                             ✅ SIM     metrics.mer (exclusivo do Everest)

───── 2.3 COLUNAS DA TABELA META (UTMify) ─────

 Coluna UTMify          Status    Notas
────────────────────────────────────────
 Status                 ✅ SIM
 Nome                   ✅ SIM
 Orçamento              ✅ SIM     daily_budget
 Vendas                 ✅ SIM     conversions
 CPA                    ✅ SIM
 Gastos                 ✅ SIM     spend
 Faturamento            ❌ NÃO     Não há receita por campanha (dados vêm do Meta, não da plataforma)
 Lucro                  ❌ NÃO     Idem — requer cruzamento com vendas
 ROAS                   ✅ SIM
 Margem                 ❌ NÃO     Requer cruzamento com custos
 ROI                    ❌ NÃO     Requer cruzamento com custos
 IC (Investimento/Conv) ❌ NÃO     Métrica ausente
 CPI                    ❌ NÃO     Custo por impressão ausente
 CPC                    ❌ NÃO     Não exibido na tabela (disponível no type mas não renderizado)
 CTR                    ✅ SIM
 CPM                    ✅ SIM     (na tabela de ad sets, não na de campanhas)
 Impressões             ✅ SIM
 Cliques                ✅ SIM     (nos dados, não sempre na UI)

───── 2.4 COLUNAS UTM (UTMify) ─────

 Coluna UTMify          Status    Notas
────────────────────────────────────────
 utm_campaign           ✅ SIM
 Vendas                 ✅ SIM
 CPA                    ✅ SIM
 Gastos                 ✅ SIM
 Faturamento            ✅ SIM
 Lucro                  ✅ SIM
 ROAS                   ✅ SIM
 Margem                 ✅ SIM
 ROI                    ✅ SIM
 CPI                    ✅ SIM
 CPC                    ✅ SIM
 CTR                    ✅ SIM
 CPM                    ✅ SIM
 Impressões             ✅ SIM
 Cliques                ✅ SIM
 Add to Cart            ❌ NÃO
 CPT                    ❌ NÃO
 Conversão              ❌ NÃO     (diferente de vendas — é taxa de conversão)
 Conv. Checkout         ❌ NÃO
 Vis. de Página         ❌ NÃO
 Vendas Pendentes       ❌ NÃO
 Vendas Totais          ❌ NÃO     (vs. vendas aprovadas)

───── 2.5 FEATURES GLOBAIS ─────

 Feature UTMify                   Status    Notas
──────────────────────────────────────────────────
 Dark Mode                       ✅ SIM     Zustand theme toggle (dark/light)
 Config de Colunas               ❌ NÃO     Colunas são fixas em todas as tabelas
 Export (CSV/XLSX)                ⚠️ PARCIAL UTM Tracking tem botão Export CSV. Outras telas não
 Filtros Avançados                ⚠️ PARCIAL Busca por nome em Campanhas. Sem filtros combinados (status + período + métrica)
 Gamificação (Prêmios)           ❌ NÃO     Sem sistema de prêmios/conquistas
 Programa de Indicação           ❌ NÃO     Sem referral program
 Multi-plataforma (Google/Kwai)  ❌ NÃO     Apenas Meta Ads
 Seleção de Período              ✅ SIM     today / 7d / 14d / 30d
 Responsividade Mobile           ✅ SIM     useIsMobile() em todos os componentes
 PWA / App                       ❌ NÃO     Sem manifest.json para PWA, sem app nativo

───── 2.6 FEATURES EXCLUSIVAS DO ADS EVEREST (não existem no UTMify) ─────

 Feature                          Arquivo
──────────────────────────────────────────
 Signal Engine (CAPI L1-L5)      src/components/SignalEngine/ + src/services/capi/
 Signal Audit (8 pilares)        src/components/SignalAudit/
 Signal Gateway                  src/components/SignalGateway/ + src/services/gatewayService.ts
 Creative Vision (IA)            src/components/CreativeVision/ + src/services/creativeVision.ts
 Entity ID Clustering            src/services/entityDetector.ts + Creatives/EntityIDMap.tsx
 Agente IA (Chat)                src/components/Agent/
 Pipeline Educacional            src/components/Pipeline/
 Playbook (Knowledge Base)       src/components/Playbook/
 Chrome Extension (sidePanel)    extension/
 EMQ Monitor                     src/components/SignalEngine/EMQMonitorAdvanced.tsx
 Synthetic Events                src/services/capi/ + constants.ts
 Funnel Builder                  src/components/SignalEngine/FunnelBuilder.tsx
 Account Score Gauge             src/components/Dashboard/AccountScore.tsx
 Command Bar (Spotlight)         src/components/Layout/CommandBar.tsx

════════════════════════════════════════════════════════════
SEÇÃO 3 — GAP ANALYSIS (O QUE FALTA)
════════════════════════════════════════════════════════════

🔴 CRÍTICO — Impede uso profissional como ferramenta de gestão

 1. Google Ads — Sem integração (perda de mercado enorme, UTMify suporta)
 2. TikTok Ads — Sem integração
 3. Assinatura/Billing — Sem tela de planos, sem controle de acesso por tier
 4. Taxas e Impostos — Sem tela dedicada para configurar impostos sobre vendas, taxas adicionais, custo de produto por item. Isso é CENTRAL no UTMify para cálculo de lucro real
 5. Faturamento por Campanha — As tabelas de campanhas não cruzam dados de vendas (UTMify faz isso via webhook). Sem lucro, margem e ROI por campanha
 6. Backend real para campanhas — Dados de campanhas vêm da Meta API ou mock. Não há persistência local (Supabase tem tabela campaigns, mas o fluxo não está completo)

🟡 IMPORTANTE — Reduz competitividade significativamente

 7. Config de Colunas — UTMify permite escolher quais colunas exibir nas tabelas. Ads Everest tem colunas fixas
 8. Regras de Automação customizáveis — Auto-Scale tem 6 regras hardcoded. UTMify permite criar regras custom com condições/ações/frequência dinâmicas
 9. Notificações avançadas — Push existe mas falta: config por tipo de evento, schedule de envio, templates de mensagem, canais WhatsApp/Telegram
10. Minha Conta completa — Falta: alteração de senha, 2FA, seleção de idioma
11. UTM columns avançadas — Faltam: Add to Cart, CPT, Conv. Rate, Conv. Checkout, Page Views, Vendas Pendentes vs Totais na tabela UTM
12. Vendas por Produto — Sem breakdown de vendas por produto no dashboard
13. Taxa de Aprovação por método — Sem análise Cartão vs Pix vs Boleto
14. Kwai Ads — Sem integração (nicho mas relevante no Brasil)

🔵 RELEVANTE — Complementa a experiência

15. Relatórios com Despesas — Sub-tab relatórios não inclui despesas e IC no breakdown diário
16. Integrações sub-tabs — Faltam: config UTM, config Pixel dedicada, WhatsApp integration, tela de Testes
17. Filtros combinados — Filtro apenas por busca textual. Sem filtros por status + período + range de métrica
18. Gráfico de Vendas por Pagamento — Sem gráfico pizza de métodos de pagamento
19. Vendas por Fonte no Dashboard — View utm_ranking existe no DB mas não há UI no dashboard principal
20. Multi-dashboard — UTMify Avançado permite múltiplos dashboards. Everest tem um só
21. Colaboradores — Sem sistema de convite/permissões para equipe

⚪ BAIXA PRIORIDADE — Nice-to-have

22. Suporte — Tela de tutoriais, links para comunidade, WhatsApp support
23. Aplicativo — Tela de download iOS/Android
24. Gamificação — Sistema de prêmios e conquistas
25. Programa de Indicação — Referral program
26. Chargeback tracking — Contabilização de chargebacks
27. Imposto Meta Ads — Campo específico para imposto cobrado pelo Meta

════════════════════════════════════════════════════════════
SEÇÃO 4 — PROBLEMAS NO CÓDIGO ATUAL
════════════════════════════════════════════════════════════

🐛 BUGS

 1. Dashboard usa mockCampaigns diretamente em vez dos dados do store
    Arquivo: src/components/Dashboard/Dashboard.tsx linhas 100-101, 195
    Problema: `mockMetricCards` e `mockCampaigns` são usados diretamente, ignorando dados reais do store

 2. Overview fallback para mockCampaigns
    Arquivo: src/components/Overview/Overview.tsx linha 330
    Problema: `const liveCampaigns = campaigns.length > 0 ? campaigns : mockCampaigns` — OK como fallback, mas métricas na linha 336-341 usam valores hardcoded como fallback (42.8, 4.2, etc.)

 3. Campaigns usa mockCampaigns diretamente
    Arquivo: src/components/Campaigns/Campaigns.tsx linha 38
    Problema: Filtra `mockCampaigns` em vez de `useStore.campaigns`

 4. UTMTracking dados 100% mock
    Arquivo: src/components/UTMTracking/UTMTracking.tsx
    Problema: Toda a data (CAMPANHAS_DATA, UTM_DATA, VENDAS_DATA, RELATORIO_DATA) é hardcoded. Nenhuma integração com Supabase ou store

⚠️ CÓDIGO INCOMPLETO

 5. Agente IA — respostas hardcoded
    Arquivo: src/components/Agent/Agent.tsx
    Problema: `demoResponses` com textos fixos. Serviço `aiAgent.ts` existe mas não é usado no componente

 6. CampaignCreator — apenas UI
    Arquivo: src/components/CampaignCreator/CampaignCreator.tsx
    Problema: Wizard visual completo mas ações de criação são placeholder (toast "disponível no modo Live")

 7. Auto-Scale regras estáticas
    Arquivo: src/components/AutoScale/AutoScale.tsx
    Problema: Regras hardcoded no componente. Tabela `alert_rules` existe no Supabase mas não é usada

 8. Signal Gateway sem integração real
    Arquivo: src/components/SignalGateway/SignalGateway.tsx
    Problema: Usa mock data. `gatewayService.ts` tem funções Supabase mas componente não as chama

 9. Financial — DRE incompleto
    Arquivo: src/components/Financial/Financial.tsx
    Problema: View `monthly_dre` existe no DB mas não há UI que a consuma. Cálculo de lucro líquido é simplificado

10. Vendas — sem sincronização webhook → UI
    Problema: Webhook UTMify grava em `sales`, mas `UTMTracking.tsx` usa dados mock. Fluxo quebrado.

🔒 SEGURANÇA

11. API Key em sessionStorage
    Arquivo: src/components/CreativeVision/CreativeVision.tsx linhas 38-43
    Problema: `sessionStorage.getItem(SESSION_KEY_KEY)` armazena API key do Claude/OpenAI no browser. Deveria usar Supabase Edge Function como proxy

12. ANTHROPIC_API_KEY no frontend
    Arquivo: src/utils/constants.ts linha 3
    Problema: `VITE_ANTHROPIC_API_KEY` é exposta no bundle. Qualquer usuário pode extrair

13. Meta access_token no Zustand
    Arquivo: src/store/useStore.ts
    Problema: Token fica em memória JS acessível via devtools. Não é persistido (bom), mas sem refresh token flow

📉 PERFORMANCE

14. Sem lazy loading de módulos
    Arquivo: src/App.tsx linha 8 (comentário "can React.lazy later")
    Problema: Todos os 15+ módulos são importados sincronamente. Bundle inicial desnecessariamente grande

15. Sem virtualização de tabelas
    Arquivo: UTMTracking, Dashboard, Campaigns
    Problema: Tabelas renderizam todos os rows. Com centenas de campanhas, performance degradará

16. Mock data no bundle
    Arquivo: src/data/mockData.ts (32KB) + capiMockData.ts (9.6KB)
    Problema: ~42KB de dados mock são incluídos no bundle de produção mesmo em modo live

════════════════════════════════════════════════════════════
SEÇÃO 5 — RESUMO EXECUTIVO
════════════════════════════════════════════════════════════

PERCENTUAL DE COMPLETUDE POR ÁREA (vs UTMify)

  Dashboard/Métricas ........... 55%  (faltam métricas financeiras detalhadas, vendas por produto, aprovação por método)
  Meta Ads (Contas/Camp/Conj) .. 65%  (campanhas + conjuntos OK, faltam sub-tabs Contas e Anúncios, colunas faturamento/lucro/margem)
  Multi-plataforma ............. 0%   (sem Google, TikTok, Kwai)
  UTMs ......................... 75%  (tabela robusta, faltam 7 colunas avançadas)
  Integrações .................. 50%  (webhooks + providers OK, faltam sub-tabs Pixel/WhatsApp/Testes)
  Regras de Automação .......... 40%  (regras estáticas, sem CRUD dinâmico)
  Taxas e Impostos ............. 10%  (view monthly_dre existe, sem UI, sem config de taxas por produto)
  Despesas ..................... 85%  (CRUD completo com categorias e recorrência)
  Relatórios ................... 60%  (relatório diário com 10 cols, faltam despesas e IC)
  Notificações ................. 35%  (push básico, sem schedule/templates/canais)
  Assinatura/Billing ........... 0%   (inexistente)
  Minha Conta .................. 30%  (perfil básico, sem 2FA/password/language)
  Avançado ..................... 0%   (sem multi-dashboard/colaboradores)
  Suporte ...................... 0%   (inexistente)
  Features Globais ............. 45%  (dark mode + export parcial + período, faltam config colunas/filtros avançados/gamificação)

  ── MÉDIA PONDERADA GERAL ─── 38%

  OBS: O Ads Everest tem features ÚNICAS não presentes no UTMify que agregam valor significativo:
  Signal Engine, Creative Vision IA, Entity ID Clustering, Pipeline Educacional, Playbook,
  Chrome Extension. Estas features posicionam o produto como ferramenta de OTIMIZAÇÃO,
  enquanto o UTMify é ferramenta de ATRIBUIÇÃO/GESTÃO FINANCEIRA.

PRÓXIMOS PASSOS RECOMENDADOS (prioridade):

 1. CONECTAR DADOS REAIS — Substituir mock data por dados do Supabase em UTMTracking, Dashboard e Campaigns. O backend já tem tabelas e views prontas.
 2. TELA DE TAXAS — Criar src/components/Taxes/ com: impostos sobre vendas, taxas de plataforma, custo por produto. Isso desbloqueia cálculo de lucro real.
 3. CRUZAMENTO VENDAS × CAMPANHAS — Implementar join entre `sales` (via utm_campaign) e `campaigns` para exibir faturamento, lucro, margem e ROI na tabela de campanhas.
 4. CONFIG DE COLUNAS — Adicionar UI de seleção de colunas visíveis em todas as tabelas (pattern: dropdown checkbox).
 5. REGRAS DINÂMICAS — Conectar Auto-Scale à tabela `alert_rules` do Supabase. Permitir CRUD de regras com condições/ações/frequência.
 6. GOOGLE ADS — Implementar integração Google Ads API (mesma estrutura de campanhas/conjuntos/anúncios).
 7. TELA DE ASSINATURA — Criar billing com Stripe, planos, usage limits.
 8. NOTIFICAÇÕES AVANÇADAS — Schedule de envio, templates, canais WhatsApp/Telegram.
 9. MINHA CONTA — Password change, 2FA (Supabase Auth suporta), language selector.
10. LAZY LOADING — Implementar React.lazy() + Suspense nos 15 módulos para reduzir bundle inicial.
11. SEGURANÇA — Mover API keys para Edge Functions (proxy), nunca expor no frontend.
12. FILTROS AVANÇADOS — Combinação de status + período + range de métrica em todas as tabelas.
