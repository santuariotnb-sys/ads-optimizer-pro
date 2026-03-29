# Ads Optimizer Pro — Arquitetura v2

## Problema Atual

O app tem 16 módulos numa sidebar flat. O usuário precisa navegar entre 16 itens para encontrar o que quer. Não há hierarquia visual — Dashboard, Pipeline (educacional) e Signal Engine (crítico) têm o mesmo peso na navegação. Resultado: sobrecarga cognitiva, app parece "robusto demais".

## Nova Estrutura: 3 Funções Principais

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │  OPTIMIZER   │  │  UTM STUDIO  │  │  CREATIVE INTEL     │   │
│  │  (Principal) │  │  (Tracking)  │  │  (Análise Criativos) │   │
│  └─────────────┘  └─────────────┘  └──────────────────────┘   │
│                                                                 │
│  ← 3 TABS principais no topo do app                            │
│     Cada tab tem sua própria sub-navegação interna              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tab 1: OPTIMIZER (Principal)

**O que é:** Core do app — otimização de campanhas Meta Ads.

**Módulos que entram aqui (reorganizados):**

```
OPTIMIZER
├── Overview          ← Dashboard atual (simplificado)
│   ├── 4 KPI cards (CPA, ROAS, Spend, Conversions)
│   ├── Account Score gauge
│   ├── Alertas inline (não separados)
│   └── Quick actions (escalar winners, pausar losers)
│
├── Campanhas         ← Campaigns atual
│   ├── Lista com drill-down (AdSets → Ads)
│   ├── Quick actions inline
│   └── Criar campanha (modal, não módulo separado)
│
├── Signal            ← SignalEngine + SignalAudit + SignalGateway FUNDIDOS
│   ├── Tab: Qualidade (EMQ Score + Breakdown + Audit pillars)
│   ├── Tab: Gateway (config funil + tracking script)
│   ├── Tab: CAPI Preview (payload + event log)
│   └── Tab: Regras de Valor
│
├── Escala            ← AutoScale + Audiences FUNDIDOS
│   ├── Regras automáticas com toggles
│   ├── Audiências com overlap/saturação
│   └── Guardrails de segurança
│
├── Financeiro        ← Financial atual (limpo)
│   ├── DRE simplificado
│   ├── Custos
│   └── Margens
│
└── Configurações     ← Settings atual
    ├── Integrações
    ├── Perfil
    └── Notificações
```

**O que SAI do Optimizer:**
- Pipeline (educacional → vira Playbook, acessível via ícone de ajuda `?`)
- Alertas (não é módulo separado → inline no Overview)
- Playbook (vira modal/drawer acessível globalmente)
- Agent IA (vira floating chat, acessível de qualquer tab)

### Sub-navegação do Optimizer

```
┌──────────────────────────────────────────────────────────┐
│  [Overview]  [Campanhas]  [Signal]  [Escala]  [Financeiro]│
│                                                           │
│  ← Pills/tabs horizontais, não sidebar                    │
│     Sidebar desaparece dentro de cada tab principal        │
└──────────────────────────────────────────────────────────┘
```

---

## Tab 2: UTM STUDIO

**O que é:** Plataforma de tracking UTM completa — experiência tipo Utmify.

**Redesign inspirado no Utmify:**

```
UTM STUDIO
├── Dashboard UTM
│   ├── KPI cards: Vendas rastreadas, Receita, Ticket médio, Taxa de conversão
│   ├── Gráfico de vendas por dia (AreaChart)
│   ├── Fonte principal (destaque)
│   └── Status das integrações (Utmify, Hotmart, Kiwify)
│
├── Fontes
│   ├── Tabela ranqueada de UTM sources
│   ├── Drill-down: source → campaign → content → term
│   ├── Comparação A/B entre sources
│   ├── Revenue share (pie chart)
│   └── Export CSV
│
├── Vendas
│   ├── Lista cronológica de todas as vendas
│   ├── Filtros: status, plataforma, período, source
│   ├── Detalhe da venda (modal): dados do cliente, UTMs, valores
│   ├── Timeline da venda (pending → approved → delivered)
│   └── Busca por nome/email/order_id
│
├── Links
│   ├── Gerador de UTM (builder atual, melhorado)
│   ├── Histórico de links gerados
│   ├── Templates de UTM salvos
│   ├── Preview + copy + QR code
│   └── Validação em tempo real
│
└── Webhooks
    ├── Status do webhook (connected/disconnected)
    ├── Log de eventos recebidos (últimos 50)
    ├── Retry manual
    └── Configuração de endpoint
```

### Diferenciais vs UTM atual

| Atual | Novo |
|-------|------|
| 1 tela com 2 tabs | 5 sub-views dedicadas |
| Sem gráfico temporal | AreaChart de vendas/dia |
| Sem drill-down real | Source → Campaign → Content |
| Sem lista de vendas | Lista completa com filtros |
| Gerador básico | Gerador + histórico + templates |
| Sem webhook status | Painel de webhook completo |

---

## Tab 3: CREATIVE INTELLIGENCE

**O que é:** Análise profunda de criativos com IA — o módulo do JSX reference, adaptado.

```
CREATIVE INTELLIGENCE
├── Dashboard Criativos
│   ├── 4 KPI cards: Ativos, ROAS médio, Melhor Hook Rate, Em fadiga
│   ├── Ranking de criativos (tabela sortável)
│   ├── Radar comparativo (vídeos)
│   ├── Revenue por criativo (pie)
│   └── Top Performers (3 cards destaque)
│
├── Análise Individual     ← Detail Panel slide-in
│   ├── Header: Type + Status + Fadiga + AI Score ring
│   ├── KPIs: Gasto, ROAS, CTR, CPA, Vendas, Receita
│   ├── Retenção (vídeo): ThumbStop, Hook Rate, Hold Rate, p25-p100
│   ├── Tags: Hook (score/10), CTA (score/10), Cores, Tom, Elementos, Áudio
│   ├── Frame-by-frame: Timeline visual com atenção prevista
│   └── Insights IA: positive/warning/negative bullets
│
├── Comparar              ← NOVO
│   ├── Side-by-side de 2-3 criativos
│   ├── Métricas sobrepostas
│   ├── Diferenças highlight
│   └── Recomendação: qual escalar
│
├── Upload & Análise      ← NOVO (se integrar OpenAI Vision)
│   ├── Upload de vídeo/imagem
│   ├── Frame extraction (Canvas API)
│   ├── Análise via Claude/GPT Vision
│   ├── Score gerado automaticamente
│   └── Sugestões de melhoria
│
└── Entity ID Map         ← Do Creatives atual
    ├── Agrupamento por Entity ID
    ├── Overcrowding detection (>3)
    └── Cross-creative performance
```

### Integração com OpenAI/Claude Vision

```
FLUXO DE ANÁLISE:

  Upload vídeo/imagem ──► Canvas extrai frames ──► Claude Vision analisa
        │                      │                        │
        │                      │                        ▼
        │                      │              Gera: score, tags,
        │                      │              hook/cta rating,
        │                      │              insights, sugestões
        │                      │                        │
        ▼                      ▼                        ▼
  Preview no app ◄──── Thumbnails gerados ◄──── Resultado salvo
```

**API necessária:**
- Claude Vision (Anthropic) — já tem integração no Agent
- OU OpenAI GPT-4o Vision — para análise de frames
- Frame extraction: HTML5 Canvas no browser (zero custo)
- Whisper API: transcrição de áudio do vídeo (hook falado)

---

## Layout Global

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────┐                                          ┌─────┐  │
│  │ Logo│  [OPTIMIZER]  [UTM STUDIO]  [CREATIVE]    │ ? │👤│  │
│  └─────┘                                          └─────┘  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Sub-nav (pills) ─────────────────────────────────────┐ │
│  │  [Overview]  [Campanhas]  [Signal]  [Escala]  [...]   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Content Area ────────────────────────────────────────┐ │
│  │                                                       │ │
│  │   (módulo renderizado aqui)                           │ │
│  │                                                       │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                                              ┌──────────┐  │
│                                              │ AI Chat  │  │
│                                              │ (float)  │  │
│                                              └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Header fixo (top bar)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ⚡ AdsEdge    [OPTIMIZER] [UTM] [CREATIVE]    🔔 ⚙️ 👤    │
│                                                             │
│  Nome atualizado: "AdsEdge" (mais curto, mais tech)         │
│  ou manter "Ads Optimizer Pro" se preferir                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **3 tabs principais** com ícone + label
- **Sino (alertas)** — dropdown com últimos alertas, não módulo separado
- **Engrenagem** — acesso direto a Settings
- **Avatar** — perfil do usuário
- **Sem sidebar** — a sub-navegação é horizontal (pills) dentro de cada tab

### Mobile

```
┌───────────────────────┐
│ ⚡ AdsEdge    🔔 ☰   │  ← Header compacto
├───────────────────────┤
│ [OPT] [UTM] [CREAT]  │  ← Tabs como bottom nav OU top tabs
├───────────────────────┤
│                       │
│  Sub-nav scrollável   │
│  ──────────────────►  │
│                       │
│  Content area         │
│                       │
│                       │
│              💬       │  ← AI Chat FAB
└───────────────────────┘
```

---

## Design System v2

### Princípios

1. **Menos é mais** — Reduzir density de informação. Cada view mostra apenas o essencial.
2. **Progressive disclosure** — Detalhes aparecem sob demanda (expand, modal, slide-in).
3. **Hierarquia clara** — Números grandes para KPIs, texto pequeno para context.
4. **Breathing room** — Mais espaçamento entre elementos. Gap 20-24px entre cards.
5. **Consistência** — Todos os módulos usam os mesmos componentes base.

### Mudanças visuais

| Antes | Depois |
|-------|--------|
| 16 itens na sidebar | 3 tabs + sub-nav horizontal |
| Cards densos com muitos dados | Cards com 1 métrica principal + subtitle |
| Glassmorphism pesado (blur 16-24px) | Glass sutil (blur 12px, borders mais suaves) |
| Gradients em tudo | Gradients só em CTAs e destaques |
| Muitas cores competindo | Accent principal (#6366f1) + 1 status color por contexto |
| Fontes misturadas em 1 card | Hierarquia clara: Outfit (texto), Space Grotesk (números), JetBrains (código) |

### Componentes reutilizáveis (Design System)

```
<MetricCard>        — KPI com valor grande, label, trend, ícone
<ScoreGauge>        — Círculo SVG com score (EMQ, AI Score, Account Score)
<StatusBadge>       — Pill colorida (active/paused/fresh/fadiga)
<DataTable>         — Tabela sortável com search, filtros, pagination
<SlidePanel>        — Painel lateral deslizante (detalhes)
<TabNav>            — Navegação em pills/tabs horizontal
<GlassCard>         — Card padrão com hover sutil
<EmptyState>        — Estado vazio com ícone + CTA
<ConfirmDialog>     — Confirmação de ações destrutivas
<FloatingChat>      — Chat IA minimizável (canto inferior direito)
<AlertDropdown>     — Dropdown de alertas no header
```

---

## Mapeamento: Módulos atuais → Nova estrutura

| Módulo atual | Destino v2 | Mudança |
|-------------|-----------|---------|
| Dashboard | Optimizer → Overview | Simplificado, alertas inline |
| Campaigns | Optimizer → Campanhas | CampaignCreator vira modal |
| Creatives | Creative Intel → Dashboard | Expandido com JSX reference |
| SignalEngine | Optimizer → Signal (tab Qualidade/CAPI) | Fundido com Audit + Gateway |
| SignalAudit | Optimizer → Signal (tab Qualidade) | Fundido |
| SignalGateway | Optimizer → Signal (tab Gateway) | Fundido |
| UTMTracking | UTM Studio → Fontes + Links | Expandido tipo Utmify |
| Financial | Optimizer → Financeiro | Mantido, limpo |
| Audiences | Optimizer → Escala | Fundido com AutoScale |
| Alerts | Header dropdown + Overview inline | Não é mais módulo |
| Agent | Floating chat global | Acessível de qualquer tab |
| Pipeline | Playbook (modal/drawer) | Conteúdo educacional |
| CampaignCreator | Modal dentro de Campanhas | Não é mais módulo |
| AutoScale | Optimizer → Escala | Fundido com Audiences |
| Playbook | Modal global (ícone ?) | Não é mais módulo |
| Settings | Ícone ⚙️ no header | Acesso direto |

**Resultado: 16 módulos → 3 tabs com ~12 sub-views (mas apenas 3-5 visíveis por vez)**

---

## Fluxo do Usuário

```
1. Usuário abre o app
   └── Vê: Header com 3 tabs + Overview do Optimizer
       └── 4 KPIs + Account Score + Alertas recentes + Quick actions

2. Quer otimizar campanhas
   └── Clica: Campanhas (sub-nav)
       └── Vê lista de campanhas
           └── Clica numa campanha → expande AdSets
               └── Ação: Escalar, Pausar, Duplicar

3. Quer ver tracking de vendas
   └── Clica: tab UTM STUDIO
       └── Vê: Dashboard UTM com vendas do dia
           └── Clica: Fontes → drill-down por source
           └── Clica: Vendas → lista completa com filtros

4. Quer analisar criativos
   └── Clica: tab CREATIVE INTELLIGENCE
       └── Vê: Ranking + Top Performers
           └── Clica num criativo → slide-in com análise completa
               └── Tags, retenção, insights IA, frames

5. Precisa de ajuda
   └── Clica: 💬 (floating chat)
       └── Conversa com Agent IA sobre qualquer contexto

6. Recebe alerta
   └── 🔔 badge vermelho no header
       └── Clica → dropdown com alertas
           └── Clica no alerta → navega direto pro contexto
```

---

## Prioridade de Implementação

| Fase | O que | Por quê |
|------|-------|---------|
| 1 | Layout global (header + 3 tabs + sub-nav) | Fundação — tudo depende disso |
| 2 | Migrar Overview + Campanhas + Signal | Core do Optimizer |
| 3 | UTM Studio completo | Diferencial competitivo vs Utmify |
| 4 | Creative Intelligence (adaptar JSX ref) | Feature premium |
| 5 | Floating Chat + Alert Dropdown | UX polish |
| 6 | Upload & Vision AI | Feature avançada |

---

## Observações Técnicas

### Routing
Trocar o switch/case atual por um sistema de 2 níveis:
```typescript
// Nível 1: Tab principal
type MainTab = 'optimizer' | 'utm' | 'creative';

// Nível 2: Sub-view dentro de cada tab
type OptimizerView = 'overview' | 'campaigns' | 'signal' | 'scale' | 'financial';
type UTMView = 'dashboard' | 'sources' | 'sales' | 'links' | 'webhooks';
type CreativeView = 'dashboard' | 'compare' | 'upload' | 'entitymap';

// Store
interface AppState {
  mainTab: MainTab;
  subView: string; // view atual dentro do tab
  // ...
}
```

### State
O Zustand store precisa de refactor mínimo:
- Adicionar `mainTab` e `subView` (substituir `currentModule`)
- Remover referências aos módulos antigos na navegação
- Manter os mesmos dados (campaigns, creatives, alerts, metrics)

### Performance
- Cada tab principal pode ser `React.lazy()` com Suspense
- Sub-views dentro do tab carregam eager (são leves)
- Reduz bundle inicial significativamente
