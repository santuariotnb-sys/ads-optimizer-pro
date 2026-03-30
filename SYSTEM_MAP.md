# Ads.Everest — Mapeamento Completo do Sistema

## Mapa de Funcionalidades

```
Ads.Everest — 20+ Modulos
├── Visao Geral: Dashboard com KPIs (CPA/ROAS/CTR/CPM), gauge de score da conta, sparklines e top campanhas por ROAS
├── Campanhas: Cards expansiveis por campanha com status, budget, metricas e ad sets internos
├── Criativos: Galeria com Entity ID map, score circular, Hook/Hold Rate, deteccao de fadiga (CPM +30% em 72h)
├── Analise IA: Upload video → extracao de frames (hook/corpo/CTA) → analise Claude/GPT-4o com DR Score
├── Signal Engine: Setup CAPI Level 1-5, EMQ monitor, payload preview, tracking script, funnel builder
├── Signal Gateway: Coleta server-side, enriquecimento CAPI, pipeline de eventos, config de funil + EPV/LTV
├── Signal Audit: Health check com 5 pilares, score de maturidade/risco, red-line checks, zona verde/amarela/vermelha
├── Auto-Scale: 6 regras automaticas (escalar winners, pausar losers), safety guards (10%/48h/7d), activity log
├── Publicos: Performance por audiencia com CPA, ROAS, overlap %, saturacao e frequencia
├── Alertas: Hub centralizado com severidade (critical/warning/info/success), filtros e dismiss
├── Agente IA: Chat com Claude Sonnet 4, 6 topicos rapidos, contexto de metricas/campanhas/EMQ/criativos
├── Pipeline: Educacional — Andromeda (retrieval) → GEM (ranking) → Auction (real-time bidding)
├── Playbook: 10 best practices curadas (Entity IDs, Novelty Bias, CAPI, ASC, Synthetic Events)
├── Financeiro: Revenue, despesas, DRE mensal, tracking de lucro por campanha
├── UTM Studios: Rastreamento multi-plataforma com tabelas de campanhas/UTMs/vendas/relatorios + atribuicao
├── Configuracoes: Integracoes (Utmify/Meta/Hotmart/Kiwify), preferencias gerais, notificacoes push
└── Plataformas: Abas para Meta/Google/TikTok/Kwai (PlatformAds component)
```

---

## Glossario do Produto

| Termo | Definicao |
|-------|-----------|
| **Andromeda** | Retrieval engine do Meta — filtra 1B+ ads para ~1k candidatos em <200ms |
| **GEM** | Foundation model do Meta para ranking de ads (+5% conv IG, +3% FB) |
| **Entity ID** | Agrupamento de criativos por similaridade visual (>60%). Meta usa 1 ticket de leilao por grupo |
| **EMQ** | Event Match Quality (0-10). Mede qualidade dos dados enviados via CAPI |
| **CAPI** | Conversions API — envio server-side de eventos para o Meta |
| **Signal Level** | Maturidade da implementacao CAPI: Level 1 (pixel basico) ate Level 5 (synthetic events) |
| **Synthetic Events** | Eventos comportamentais calculados (DeepEngagement, HighIntentVisitor, QualifiedLead) |
| **Signal Gateway** | Servico server-side que coleta, enriquece e entrega eventos ao Meta |
| **Signal Audit** | Health check da implementacao de sinais com 5 pilares e score de maturidade |
| **Auto-Scale** | Motor de regras para automacao de budget/status de campanhas |
| **Novelty Bias** | Algoritmo do Meta favorece criativos novos. Apos ~7-10 dias, performance cai |
| **Fadiga Criativa** | CPM subindo >30% em 72h = criativo perdendo eficiencia |
| **ThumbStop** | % de pessoas que param de scrollar ao ver o ad (primeiros 0.5s) |
| **Hook Rate** | % de impressoes que assistem 3+ segundos |
| **Hold Rate** | % de hook views que assistem 50%+ do video |
| **DR Score** | Direct Response Score (0-10) — avalia se criativo converte vs apenas branding |
| **EPV** | Earnings Per Visitor — receita media por visitante do funil |
| **LTV** | Lifetime Value — valor previsto do cliente ao longo do tempo |
| **ASC** | Advantage+ Shopping Campaigns — campanhas automatizadas do Meta |
| **CBO** | Campaign Budget Optimization — orcamento distribuido automaticamente entre ad sets |
| **Playbook** | Base de conhecimento com best practices curadas de Meta Ads |
| **Pipeline** | Visualizacao educativa da infraestrutura de IA do Meta (Andromeda → GEM → Auction) |

---

## Fluxo Principal do Usuario

### 1. Onboarding
1. Acessa https://ads-optimizer-pro.vercel.app
2. App inicia em modo **Demo** com dados mock
3. Clica "Conectar Meta" no header → OAuth do Facebook
4. Token capturado → modo **Live** ativado
5. App busca campanhas, ad sets, ads, insights via Graph API v21.0

### 2. Configuracao de Tracking
1. Vai em **Configuracoes → Integracoes**
2. Conecta Utmify (gera webhook URL com token)
3. Configura webhook na plataforma de vendas (Hotmart/Kiwify)
4. Vai em **Signal Gateway → Configurar Funil**
5. Define tipo de funil, precos, bump rates
6. Copia tracking script e instala na landing page
7. **Signal Audit** valida a implementacao (score verde = pronto)

### 3. Monitoramento
1. **Visao Geral**: Snapshot rapido de CPA, ROAS, score da conta
2. **Campanhas**: Detalhe por campanha com metricas expandiveis
3. **UTM Studios**: Vendas atribuidas por UTM com receita/lucro
4. **Alertas**: Notificacoes de problemas (CPA spike, fadiga, EMQ baixo)
5. **Push no celular**: Notificacao de venda aprovada em real-time (PWA)

### 4. Otimizacao
1. **Auto-Scale**: Regras automaticas escalam winners e pausam losers
2. **Criativos**: Entity ID map identifica overcrowding, sugere diversificacao
3. **Analise IA**: Upload de video → score + hook + CTA + DR analysis + plano de acao
4. **Agente IA**: Chat para estrategia personalizada com dados da conta
5. **Playbook**: Best practices para consulta rapida

### 5. Analise de Criativos (Fluxo Completo)
1. **Criativos → Analise IA**
2. Upload video (ate 500MB)
3. Extracao de frames (6-10 conforme duracao, timestamps estrategicos: hook/corpo/CTA)
4. Envio para Claude Vision ou GPT-4o
5. Resultado: Score, Hook (tipo/texto/visual), CTA (tipo/texto/visual), DR Score
6. Dor/Promessa/Mecanismo/Transformacao/Publico-alvo
7. Elementos faltando para conversao
8. **Gerar Solucoes**: Plano de acao concreto via IA
9. **Discutir com Agente IA**: Navega pro chat com contexto pre-carregado
10. **Exportar**: HTML com imagens dos frames + analise completa

---

## Arquitetura Tecnica

### Stack
- **Frontend**: React 19 + TypeScript 5.9 (strict) + Vite 8
- **State**: Zustand v5 (store unico, sem immer)
- **Styling**: Tailwind CSS v4 + inline styles + glassmorphism
- **Animacoes**: Motion v12
- **Icons**: lucide-react
- **Charts**: recharts + SVG custom
- **Backend**: Supabase (PostgreSQL + Edge Functions + RLS)
- **IA**: Anthropic Claude Sonnet 4 + OpenAI GPT-4o
- **API**: Meta Graph API v21.0 (cache 5min, rate limit 200/h)
- **PWA**: Service Worker + Web Push API
- **Deploy**: Vercel

### Navegacao
- Sem React Router — navegacao via `currentModule` no Zustand
- 3 tabs principais: Optimizer | UTM | Creative
- Sub-nav lateral com icones por modulo
- Lazy loading via `React.lazy()` + Suspense

### Dados
- **Modo Demo**: Mock data (6 campanhas, 8 audiencias, 15 alertas, criativos)
- **Modo Live**: Meta Graph API v21.0 + Supabase
- **Persistencia**: Supabase (vendas, webhooks, gateway events, push subscriptions, integracoes)
- **Sessao**: sessionStorage para API keys (seguranca)

---

## Thresholds e Regras

| Regra | Threshold |
|-------|-----------|
| CPA spike | +25% em 24h |
| CPM fadiga | +30% em 72h |
| CTR minimo | 1% |
| Frequencia maxima | 3.0 |
| ROAS minimo | 1.0 |
| EMQ minimo | 8.0 |
| Learning phase max | 14 dias |
| Novelty bias | 7 dias |
| Entity ID overcrowded | >3 criativos |
| Auto-scale max | +10% budget |
| Auto-scale cooldown | 48h |
| Decisao minima | 7 dias de dados |

---

## Gaps e Oportunidades

### Funcionalidades Incompletas
- **Auto-Scale**: "Acoes esta semana" e "Budget otimizado" hardcoded (precisa dados historicos)
- **Platform Ads**: Abas Google/TikTok/Kwai tem componente PlatformAds mas implementacao minima
- **Financial**: Usa mix de mock data + dados reais de vendas
- **UTM Studios**: Tabelas usam mock data extensivo — integracao completa com salesService pendente

### Integracoes Planejadas mas Nao Implementadas
- Google Ads API (aba existe, backend nao)
- TikTok Ads API (aba existe, backend nao)
- Kwai Ads API (aba existe, backend nao)
- WhatsApp Business API (toggle existe em notificacoes)
- Telegram Bot (toggle existe em notificacoes)
- Email alerts (toggle existe)

### Onde o Agente IA Poderia Ter Mais Autonomia
1. **Auto-gerar relatorio semanal** com insights e acoes recomendadas
2. **Executar acoes do Auto-Scale** apos aprovacao (hoje so recomenda)
3. **Analisar todos os criativos** em batch e rankear
4. **Detectar anomalias** em real-time e notificar via push
5. **Sugerir novos criativos** baseado nos winners (gerar briefing)

### Melhorias de UX
1. Conectar UTM Studios ao salesService real (substituir mocks)
2. Adicionar graficos de tendencia no Auto-Scale
3. Historico de analises de criativos (hoje perde ao sair da pagina)
4. Comparacao lado-a-lado de criativos
5. Dashboard unificado com visao cross-plataforma

---

## 3 Perguntas para o Time de Produto

1. **UTM Studios**: O plano e usar dados reais do Supabase (salesService) ou manter as tabelas como input manual do usuario? O webhook da Utmify ja alimenta a tabela `sales` — falta conectar ao componente UTMTracking.

2. **Auto-Scale**: As regras devem ser **executadas automaticamente** (alterar budget via Graph API) ou apenas **recomendar** acoes que o usuario executa manualmente? Hoje o codigo calcula as acoes mas nao envia para a API do Meta.

3. **Plataformas adicionais**: Google/TikTok/Kwai estao no roadmap real ou sao placeholders? Se real, qual a prioridade e ha budget para API access de cada plataforma?
