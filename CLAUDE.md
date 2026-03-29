# Ads Optimizer Pro

Plataforma all-in-one de otimização de campanhas Meta Ads (Facebook/Instagram).
13 módulos: Dashboard, Campanhas, Criativos + Entity ID, Signal Engine (CAPI), Públicos, Alertas, Agente IA, Pipeline, Criar Campanha, Auto-Scale, Signal Audit, Playbook, Chrome Extension (sidePanel).

## Stack

- **Runtime**: Vite 8 + React 19 + TypeScript 5.9 (strict mode ON)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`) + inline styles para valores dinâmicos/responsivos
- **State**: Zustand v5 — store único em `src/store/useStore.ts`
- **Icons**: lucide-react
- **Charts**: recharts (importado mas SVG custom usado nos sparklines)
- **Extension**: Chrome Manifest v3
- **Locale**: Português Brasil (pt-BR). Moeda em BRL (R$).

## Comandos

```bash
npm run dev       # Dev server com HMR (Vite)
npm run build     # tsc -b && vite build (type check + bundle)
npm run lint      # ESLint strict
npm run preview   # Preview do bundle de produção
```

O build FALHA se houver erros de TypeScript (strict mode, noUnusedLocals, noUnusedParameters).

## Arquitetura

### Dois modos de operação
- **Demo** (`mode: 'demo'`): dados mock carregados no `App.tsx` via `useEffect`. Ativado automaticamente quando não há `accessToken`.
- **Live** (`mode: 'live'`): conectado à Meta Marketing API v21.0. Token capturado pela Chrome Extension ou inserido manualmente.

### State (Zustand)
Store único sem immer. Padrão: `useStore((s) => s.propriedade)` para selectors ou destructuring completo.
- Auth: `mode`, `accessToken`, `adAccountId`
- Data: `campaigns`, `adSets`, `ads`, `creatives`, `audiences`, `alerts`, `chatMessages`
- Métricas: `metrics` (DashboardMetrics), `emqScore`
- UI: `currentModule`, `selectedPeriod`, `selectedCampaign`, `sidebarCollapsed`, `isLoading`

### Navegação
Sem React Router. Navegação via `currentModule` no store. `App.tsx` tem um switch/case (`ModuleRouter`) que renderiza o componente correto.

### Services
| Arquivo | Responsabilidade |
|---------|-----------------|
| `metaApi.ts` | Wrapper da Graph API v21.0 com cache (5min TTL) e rate limiting (200/h) |
| `alertEngine.ts` | `evaluateAlerts(campaigns, emq)` → gera alertas baseado em thresholds |
| `autoScaler.ts` | `evaluateAutoScale(campaigns, cpaTarget)` → ações de budget |
| `entityDetector.ts` | Agrupa criativos por Entity ID, detecta overcrowding (>3 por grupo) |
| `aiAgent.ts` | Integração Anthropic API (claude-sonnet-4-20250514) |
| `capi/*` | CAPI Level 5: payload builder, synthetic events, EMQ enrichment, tracking |

### Types
- `src/types/meta.ts` — Interfaces principais: Campaign, AdSet, Ad, Creative, Alert, Audience, CAPIEvent, etc.
- `src/types/capi.ts` — Types de Signal Engineering: FunnelConfig, SyntheticEventRule, ValueRule, etc.

## Design System

### Cores
```
Background:    #0c0c14
Surface:       rgba(22, 22, 32, 0.98)
Border:        rgba(255, 255, 255, 0.06)
Text:          #e2e8f0
Text muted:    #64748b
Accent:        #6366f1 (indigo)
Accent light:  #8b5cf6 (violet)
Success:       #4ade80
Danger:        #f87171
Warning:       #facc15
Info:          #60a5fa
```

### Fontes
- **Outfit** — corpo, UI geral
- **Space Grotesk** — números grandes, headings de métricas
- **JetBrains Mono** — dados, código, JSON, valores mono

Carregadas via Google Fonts no `index.html`.

### Glassmorphism (padrão dos cards)
```css
background: rgba(22, 22, 32, 0.85);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 16px;
```
Hover: `border-color: rgba(255,255,255,0.12)` + `box-shadow: 0 0 30px rgba(99,102,241,0.06)`

### CSS classes utilitárias (definidas em `index.css`)
`.glass-card`, `.glow-accent`, `.glow-success`, `.glow-danger`, `.gradient-text`, `.gradient-border`, `.animate-pulse-live`, `.animate-shimmer`, `.animate-fade-in`, `.stagger-children`, `.number-display`, `.mono-data`

### Responsividade
Hook custom `useIsMobile()` em `src/hooks/useMediaQuery.ts` (breakpoint 768px).
Todos os componentes usam `const isMobile = useIsMobile()` e aplicam estilos inline condicionais:
```tsx
gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'
```
Mobile: sidebar vira overlay com backdrop, grids colapsam, tabs ficam scrolláveis horizontalmente.

## Convenções de código

### Estrutura de componentes
- Um módulo = uma pasta em `src/components/NomeModulo/`
- Componente principal: `NomeModulo.tsx`
- Sub-componentes no mesmo diretório
- Inline styles para layout/posicionamento (flexbox, grid, padding, gap)
- Classes CSS (Tailwind/custom) para design tokens estáticos

### Padrões a seguir
- TypeScript strict — sem `any`, sem imports não usados
- Zustand puro — sem immer, sem middleware
- Inline styles com `React.CSSProperties` para type safety
- `lucide-react` para todos os ícones (nunca SVG inline manual)
- Formatação: `formatCurrency()`, `formatPercent()`, `formatNumber()` de `utils/formatters.ts`
- Cores: usar constantes de `utils/constants.ts` (objeto `COLORS`)
- Labels/texto: sempre em português (pt-BR)

### O que NÃO fazer
- Não usar `localStorage` para tokens (segurança). Usar `sessionStorage` ou Zustand.
- Não fazer polling agressivo à Graph API (mínimo 5min entre requests).
- Não mudar budget em mais de 10% por vez (regra 10%/48h).
- Não adicionar dependências de CSS-in-JS (styled-components, emotion). O padrão é inline + Tailwind.

## Chrome Extension (sidePanel API)

```
extension/
├── manifest.json      # Manifest v3 + sidePanel
├── background.js      # Service worker: sidePanel management + token capture + polling
├── sidepanel.html     # Side panel UI (mini dashboard)
├── sidepanel.js       # Side panel logic
└── icons/             # 16, 32, 48, 128px
```

- **background.js**: `chrome.sidePanel.setPanelBehavior` + `setOptions` por tab (apenas Ads Manager)
- **sidepanel.html/js**: mini dashboard com métricas, alertas, ações rápidas
- **Comunicação**: `chrome.runtime.sendMessage` entre background ↔ sidepanel
- **Storage**: `chrome.storage.session` (nunca localStorage)
- **Polling**: `chrome.alarms` com intervalo de 5 minutos

## Thresholds e regras (constants.ts)

| Regra | Threshold |
|-------|-----------|
| CPA aumento | +25% em 24h |
| CPM aumento (fadiga) | +30% em 72h |
| CTR mínimo | 1% |
| Frequência máxima | 3.0 |
| ROAS mínimo | 1.0 |
| EMQ mínimo | 8.0 |
| Learning phase máxima | 14 dias |
| Novelty bias | 7 dias |
| Entity ID overcrowded | >3 criativos |
| Auto-scale máximo | +10% budget |
| Auto-scale cooldown | 48h entre ajustes |
| Decisão mínima | 7 dias de dados |

## Deploy

Hospedado na Vercel: https://ads-optimizer-pro.vercel.app
GitHub: https://github.com/santuariotnb-sys/ads-optimizer-pro

```bash
vercel --prod
```
