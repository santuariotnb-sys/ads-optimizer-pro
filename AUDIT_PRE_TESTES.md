# Auditoria Pré-Testes — Ads Optimizer Pro
**Data:** 2026-03-31

---

## FASE 1 — DIAGNÓSTICO

### Dependências
| Item | Status | Detalhe |
|------|--------|---------|
| node_modules | OK | 306 pacotes instalados |
| React 19.2 | OK | |
| TypeScript 5.9 (strict) | OK | noUnusedLocals, noUnusedParameters |
| Vite 8.0 | OK | Build em ~400ms |
| Zustand 5.0 | OK | |
| Supabase JS 2.100 | OK | |
| Motion 12.38 | OK | |
| @vercel/node 5.6 | OK | |
| Build (`npm run build`) | OK | Zero erros |

### Variáveis de Ambiente
| Variável | Status | Risco |
|----------|--------|-------|
| `VITE_META_APP_ID` | OK | Valor real presente |
| `VITE_META_APP_SECRET` | OK | Valor real presente |
| `VITE_META_REDIRECT_URI` | OK | Aponta para produção |
| `VITE_SUPABASE_URL` | OK | Projeto Supabase conectado |
| `VITE_SUPABASE_ANON_KEY` | OK | JWT válido |
| `VITE_VAPID_PUBLIC_KEY` | OK | Web Push configurado |
| `VITE_ANTHROPIC_API_KEY` | AUSENTE | Agent IA não funciona sem isso |
| `META_ACCESS_TOKEN` (Vercel env) | CONFIGURADO PELO USUÁRIO | Necessário para CAPI funcionar |

### Conexões Externas
| Serviço | Status | Detalhe |
|---------|--------|---------|
| Supabase (DB) | OK | URL e key configurados, client com proxy fallback |
| Meta Graph API | OK | App ID + Secret presentes, endpoints em api/ |
| Vercel Functions | OK | 5 endpoints em api/ |
| Supabase Edge Functions | OK | 4 functions + 7 shared |
| Google Fonts | OK | Outfit, Space Grotesk, JetBrains Mono |

### Segurança
| Item | Status | Severidade |
|------|--------|-----------|
| `.env` com credenciais reais no git | **FALHA** | **CRÍTICO** — Meta App Secret e Supabase keys expostos no repositório |
| Hardcoded secrets no código fonte | OK | Nenhum encontrado |
| CORS em api/capi/event.ts | RISCO MÉDIO | `Access-Control-Allow-Origin: *` (necessário para sendBeacon, mas aberto) |
| Supabase RLS | OK | Todas as tabelas têm RLS habilitado |
| Token no body (não na URL) | OK | Corrigido na auditoria anterior |
| Senha mínima Supabase | RISCO BAIXO | 6 caracteres (deveria ser 8+) |

---

## FASE 2 — DADOS PLACEHOLDER

### Decisão Arquitetural
O app tem **modo dual** (demo/live). **Mock data é intencional e necessário** para o modo demo. Remover mock data = quebrar a experiência de demonstração.

**Abordagem correta:** NÃO remover os mocks. Garantir que eles SÓ aparecem quando `mode === 'demo'` e que dados reais os substituem quando `mode === 'live'`.

### Inventário Completo de Mock Data

#### Arquivos dedicados de mock
| Arquivo | Conteúdo | Registros | Modo |
|---------|----------|-----------|------|
| `src/data/mockData.ts` | Campanhas, audiences, alerts, creatives, ad sets, ads, metrics, playbook, signal audit | ~120 registros | Demo only |
| `src/data/capiMockData.ts` | Funnel config, value rules, event logs, EMQ analysis, CAPI state | ~20 registros | Demo only |

#### Mock data inline em componentes
| Componente | Conteúdo | Remove? |
|-----------|----------|---------|
| `SignalGateway.tsx:18-44` | MOCK_STATS, MOCK_PIPELINE (fallback quando Supabase vazio) | NÃO — fallback necessário |
| `Financial.tsx:39-51` | MOCK_SUMMARY, MOCK_EXPENSES | NÃO — fallback demo |
| `TraceSummary.tsx:182-186` | MOCK_SUMMARY (diferente do Financial) | NÃO — fallback demo |
| `AutoScale.tsx:19-26,61-67` | MOCK_RULES, activityLog | NÃO — fallback demo |
| `Agent.tsx:27-145` | demoResponses (respostas IA pré-escritas) | NÃO — fallback quando sem API key |
| `Settings.tsx:311-323` | Webhook test payload (exemplo JSON) | NÃO — é documentação visual |
| `FunnelBuilder.tsx:93` | Hash fake de phone (exemplo) | NÃO — é placeholder de form |

#### Dados fake identificados (valores específicos)
| Dado | Onde aparece | Tipo |
|------|------------|------|
| "Protocolo Detox" | mockData, capiMockData, Agent | Nome de produto fake |
| "Kit Skincare", "Colágeno Premium" | mockData | Nomes de produtos fake |
| R$37, R$42.50, R$52.40, etc | Múltiplos | Preços fake |
| "maria@email.com" | Settings.tsx | Email fake (exemplo webhook) |
| "11999998888" | Settings.tsx, SignalGateway.tsx | Phone fake (exemplo código) |
| "189.42.xxx.xxx" | capiMockData | IP fake |
| camp_001 a camp_006 | mockData | IDs fake de campanhas |
| ROAS 3.82, CPA R$42.50, etc | mockData | Métricas fake |

### Veredicto: NENHUM mock data deve ser removido

Motivos:
1. App opera em modo demo por padrão (sem token Meta)
2. Todos os mocks servem como fallback quando dados reais não existem
3. Remover quebra 100% da experiência de demonstração
4. O padrão já está correto: `stats.eventsTotal > 0 ? realData : MOCK_STATS`

---

## FASE 3 — RELATÓRIO FINAL

### O que foi verificado e está OK
- [x] Todas as dependências instaladas e funcionais
- [x] Build TypeScript strict passa sem erros
- [x] Supabase configurado com URL e key reais
- [x] Meta App ID e Secret presentes
- [x] 5 Vercel API endpoints presentes e corretos
- [x] 4 Supabase Edge Functions + 7 shared modules
- [x] 7 migrations SQL + tabela workspaces (adicionada nesta sessão)
- [x] Mock data isolado e intencional para modo demo
- [x] Nenhum secret hardcoded no código fonte
- [x] RLS habilitado em todas as tabelas Supabase

### O que precisa de ação

#### CRÍTICO
1. **`.env` no histórico do git** — Credenciais Meta e Supabase expostas
   - Ação: `git filter-repo` para remover do histórico + rotacionar Meta App Secret
   - Onde: raiz do projeto

#### NECESSÁRIO PARA TESTES
2. **`META_ACCESS_TOKEN`** — Já configurado pelo usuário no Vercel
   - Onde: Vercel → Settings → Environment Variables
   - Status: OK (usuário confirmou)

3. **`VITE_ANTHROPIC_API_KEY`** — Ausente
   - Onde: `.env` ou Vercel env vars
   - Impacto: Módulo Agent IA não funciona

#### RECOMENDADO
4. **Senha mínima Supabase** — 6 chars → aumentar para 8
   - Onde: `supabase/config.toml` linha ~171

5. **CORS mais restritivo** — `*` → domínio específico
   - Onde: `api/capi/event.ts` linha 26
   - Trade-off: Restringir impede tracking de LPs em outros domínios

### O que precisa ser preenchido com dado real (e onde)

| Item | Onde configurar | Quando |
|------|----------------|--------|
| Pixel ID | Pulse Router → Configurar Funil → Pixel ID | Ao configurar primeiro funil |
| CAPI Token | Pulse Router → Configurar Funil → CAPI Token | Ao configurar primeiro funil |
| Gateway URL | Auto-preenchido com URL Supabase | Automático |
| Valores do funil (front, bumps, upsells) | Pulse Router → Configurar Funil | Por produto |
| Webhook secrets | Settings → Integrações | Ao conectar Hotmart/Kiwify |
| Anthropic API Key | .env → VITE_ANTHROPIC_API_KEY | Para usar Agent IA |
