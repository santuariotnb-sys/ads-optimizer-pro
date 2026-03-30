# Plano de Reestruturacao — Workspace-Centric Model

> Gerado em 2026-03-29 | NAO IMPLEMENTAR — apenas plano de referencia

---

## Estado Atual (Mapa Completo)

### Arquivos de Navegacao
| Arquivo | O que define |
|---------|-------------|
| `src/App.tsx` | `optimizerNav[]`, `utmNav[]`, `creativeNav[]`, `ModuleRouter` switch/case (~40 cases) |
| `src/components/Layout/TopNav.tsx` | `tabs[]` com labels PAINEL / UTM STUDIO / CRIATIVOS |
| `src/components/Layout/SubNav.tsx` | Renderiza items recebidos por props (sem hardcode) |
| `src/components/Layout/CommandBar.tsx` | `actions[]` com 4 quick-actions hardcoded |
| `src/components/Layout/Sidebar.tsx` | `navItems[]` com 16 items (sidebar legada, nao usada no layout atual) |

### Modulos e seus IDs de Rota
| Modulo Atual | Route IDs | Componente | Pasta |
|-------------|-----------|------------|-------|
| Signal Gateway | `opt-gateway`, `gateway` | `<SignalGateway />` | `src/components/SignalGateway/` |
| UTM Studio | `utm-campanhas`, `utm-utms`, `utm-vendas`, `utm-relatorios`, `utm-despesas` | `<UTMTracking />` | `src/components/UTMTracking/` |
| Rastreamento (Signal Engine) | `opt-signal`, `signal` | `<SignalEngine />` | `src/components/SignalEngine/` |
| Signal Audit | `opt-audit`, `signalaudit` | `<SignalAudit />` | `src/components/SignalAudit/` |
| Auto-Scale | `opt-scale`, `autoscale` | `<AutoScale />` | `src/components/AutoScale/` |
| Pipeline | `opt-pipeline`, `pipeline` | `<Pipeline />` | `src/components/Pipeline/` |
| Playbook | `opt-playbook`, `playbook` | `<Playbook />` | `src/components/Playbook/` |
| Agente IA | `opt-agent`, `agent` | `<Agent />` | `src/components/Agent/` |

### Services Envolvidos
| Service | Usado por |
|---------|-----------|
| `services/gatewayService.ts` | SignalGateway (imports: `fetchGatewayStats`, `fetchGatewayPipeline`, `fetchFunnelConfig`, etc.) |
| `services/autoScaler.ts` | AutoScale (imports: `evaluateAutoScale`) |
| `services/alertEngine.ts` | App.tsx (imports: `evaluateAlerts`) |
| `services/aiAgent.ts` | Agent |
| `services/capi/*` | SignalEngine (6 arquivos) |

### Tabelas Supabase (existentes)
`profiles`, `integrations`, `sales`, `campaigns`, `campaign_metrics`, `expenses`, `alerts`, `alert_rules`, `webhook_logs`, `visitor_identities`, `purchases`, `funnel_config`, `gateway_events`, `emq_daily`, `gateway_audit_log`

### Views Supabase
`sales_summary`, `monthly_dre`, `utm_ranking`, `gateway_daily_summary`, `gateway_funnel_pipeline`

---

## Tabela de Renomeacao

| Atual | Novo Nome | Label pt-BR |
|-------|-----------|-------------|
| Signal Gateway | Pulse Router | Pulse Router |
| UTM Studio + Rastreamento | Trace Engine | Trace Engine |
| Signal Audit | Shield Audit | Shield Audit |
| Auto-Scale | Orbit Engine | Orbit Engine |
| Pipeline | Flow Builder | Flow Builder |
| Playbook | Command Set | Command Set |
| Agente IA | Apex | Apex |

---

## PHASE 1 — Safe Renames (Labels Only)

**Objetivo**: Mudar apenas labels visiveis. Zero mudanca estrutural. Tudo continua funcionando.

### 1.1 — `src/App.tsx` (optimizerNav labels)
```
Linha 49: 'Signal Gateway' → 'Pulse Router'
Linha 50: 'Signal Audit' → 'Shield Audit'
Linha 51: 'Auto-Scale' → 'Orbit Engine'
Linha 53: 'Rastreamento' → 'Trace Engine'
Linha 54: 'Agente IA' → 'Apex'
Linha 55: 'Pipeline' → 'Flow Builder'
Linha 56: 'Playbook' → 'Command Set'
```

### 1.2 — `src/App.tsx` (utmNav labels — se UTM Studio vira parte do Trace Engine, apenas renomear tab por enquanto)
Nenhuma mudanca nesta fase. UTM Studio continua como tab separada.

### 1.3 — `src/components/Layout/TopNav.tsx` (tabs[])
```
Linha 18: label 'UTM STUDIO' → 'TRACE ENGINE' (somente se collapsing ja na fase 1 — NAO, manter como esta)
```
**Decisao**: NAO mudar TopNav na Phase 1. Mudanca sera na Phase 3.

### 1.4 — `src/components/Layout/Sidebar.tsx` (navItems[] — sidebar legada)
```
Linha 17: 'Signal Gateway' → 'Pulse Router'
Linha 18: 'Signal Engine' → (removido da sidebar legada, ja nao e usado)
Linha 22: 'Agente IA' → 'Apex'
Linha 23: 'Pipeline' → 'Flow Builder'
Linha 24: 'Auto-Scale' → 'Orbit Engine'
Linha 25: 'Signal Audit' → 'Shield Audit'
Linha 26: 'Playbook' → 'Command Set'
```

### 1.5 — `src/components/Layout/CommandBar.tsx` (actions[])
Nenhuma mudanca necessaria — CommandBar tem apenas: Visao Geral, Campanhas, UTMs, Criativos.

### 1.6 — Titulos internos dos componentes
| Arquivo | Mudanca |
|---------|---------|
| `src/components/SignalGateway/SignalGateway.tsx` | Titulo interno "Signal Gateway" → "Pulse Router" |
| `src/components/SignalAudit/SignalAudit.tsx` | Titulo interno "Signal Audit" → "Shield Audit" |
| `src/components/AutoScale/AutoScale.tsx` | Titulo interno "Auto-Scale" → "Orbit Engine" |
| `src/components/Pipeline/Pipeline.tsx` | Titulo interno "Pipeline" → "Flow Builder" |
| `src/components/Playbook/Playbook.tsx` | Titulo interno "Playbook" → "Command Set" |
| `src/components/Agent/Agent.tsx` | Titulo interno "Agente IA" → "Apex" |
| `src/components/SignalEngine/SignalEngine.tsx` | Titulo interno (se houver) → "Trace Engine" |

### 1.7 — Icones (opcional nesta fase)
Manter os mesmos icones. Lucide icons nao mudam.

### Riscos Phase 1
- **Risco ZERO**: Apenas strings de texto mudam. Nenhum ID, nenhuma rota, nenhum import.
- **Rollback**: `git revert` do commit.

### Arquivos tocados: ~9 arquivos
```
src/App.tsx
src/components/Layout/Sidebar.tsx
src/components/SignalGateway/SignalGateway.tsx
src/components/SignalAudit/SignalAudit.tsx
src/components/AutoScale/AutoScale.tsx
src/components/Pipeline/Pipeline.tsx
src/components/Playbook/Playbook.tsx
src/components/Agent/Agent.tsx
src/components/SignalEngine/SignalEngine.tsx
```

---

## PHASE 2 — Database (Workspaces Table)

**Objetivo**: Criar tabela `workspaces` como entidade central. NAO migrar dados ainda.

### 2.1 — Nova migration: `005_workspaces.sql`

```sql
-- workspaces: entidade central do modelo
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  business_type TEXT, -- 'ecommerce', 'infoproduct', 'saas', 'leadgen', 'local'
  pixel_id TEXT,
  capi_token_encrypted TEXT,
  tracking_script TEXT, -- script gerado automaticamente
  onboarding_completed BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}', -- configuracoes flexiveis
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own workspaces" ON workspaces
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_workspaces_user ON workspaces(user_id);
```

### 2.2 — Adicionar `workspace_id` nas tabelas existentes (nullable primeiro!)

```sql
-- Adicionar workspace_id como NULLABLE em todas as tabelas de dados
ALTER TABLE integrations ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE campaigns ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE campaign_metrics ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE alerts ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE alert_rules ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE funnel_config ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE gateway_events ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE visitor_identities ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE purchases ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- Indexes para workspace queries
CREATE INDEX idx_sales_workspace ON sales(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_campaigns_workspace ON campaigns(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_gateway_events_workspace ON gateway_events(workspace_id) WHERE workspace_id IS NOT NULL;
```

### 2.3 — Tipo TypeScript: `src/types/database.ts`

Adicionar `workspaces` table definition na interface `Database`, com Row/Insert/Update.
Adicionar `workspace_id?: string | null` em todas as tabelas Row/Insert existentes.

### 2.4 — Zustand store: `src/store/useStore.ts`

Adicionar ao state:
```ts
currentWorkspace: Workspace | null;
workspaces: Workspace[];
setCurrentWorkspace: (ws: Workspace | null) => void;
setWorkspaces: (ws: Workspace[]) => void;
```

### 2.5 — Novo service: `src/services/workspaceService.ts`

CRUD basico: `createWorkspace`, `getWorkspaces`, `updateWorkspace`, `deleteWorkspace`.

### Riscos Phase 2
- **Risco BAIXO**: Colunas nullable nao quebram queries existentes.
- **Risco MEDIO**: Views (`sales_summary`, `monthly_dre`, `utm_ranking`, `gateway_daily_summary`, `gateway_funnel_pipeline`) nao incluem `workspace_id` — mas como e nullable, continuam funcionando.
- **Rollback**: Migration reversa removendo colunas.

### Arquivos tocados: ~4 arquivos + 1 novo
```
supabase/migrations/005_workspaces.sql (NOVO)
src/types/database.ts
src/store/useStore.ts
src/services/workspaceService.ts (NOVO)
```

---

## PHASE 3 — Navigation Restructure

**Objetivo**: Nova estrutura de navegacao com Workspace como contexto central.

### 3.1 — Nova estrutura de tabs (TopNav)

**Antes**: PAINEL | UTM STUDIO | CRIATIVOS
**Depois**: COMANDO | TRACE ENGINE | CRIATIVOS

```
Tab "COMANDO" (id: 'cmd'):
  - Visao Geral (dashboard + overview merged)
  - Campanhas
  - Orbit Engine (ex Auto-Scale)
  - Publicos
  - Alertas
  - Apex (ex Agente IA)
  - Flow Builder (ex Pipeline, com Playbook/Command Set embutido)
  - Financeiro
  - Configuracoes

Tab "TRACE ENGINE" (id: 'trace'):
  - Painel Trace (visao unificada de UTMs + Signal Engine + Pulse Router)
  - Eventos (event log)
  - Funil (funnel builder)
  - Integracoes
  - Facebook / Google / TikTok / Kwai (platform ads)

Tab "CRIATIVOS" (id: 'cre'):
  - Criativos
  - Analise IA (Creative Vision)
```

### 3.2 — Arquivos a mudar

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Reescrever `optimizerNav[]` → `comandoNav[]`, `utmNav[]` → `traceNav[]`. Reescrever `ModuleRouter` switch/case. Mudar `getActiveTab()` e `getSubNavItems()`. |
| `src/components/Layout/TopNav.tsx` | Mudar `tabs[]`: ids `opt`→`cmd`, `utm`→`trace`. Mudar labels. Atualizar `getActiveTab()`. |
| `src/components/Layout/CommandBar.tsx` | Atualizar `actions[]` para refletir novos module IDs. |
| `src/components/Layout/Sidebar.tsx` | Atualizar `navItems[]` (ou deprecar completamente se nao e mais usado). |

### 3.3 — Workspace Selector no TopNav

Adicionar dropdown no TopNav (entre logo e tabs) mostrando workspace ativo.
Se nao houver workspace, redirecionar para onboarding (Phase 5).

### 3.4 — Route IDs novos

| Antigo | Novo |
|--------|------|
| `opt-overview` | `cmd-overview` |
| `opt-campaigns` | `cmd-campaigns` |
| `opt-scale` | `cmd-orbit` |
| `opt-audiences` | `cmd-audiences` |
| `opt-alerts` | `cmd-alerts` |
| `opt-agent` | `cmd-apex` |
| `opt-pipeline` | `cmd-flow` |
| `opt-playbook` | (merged into cmd-flow) |
| `opt-financial` | `cmd-financial` |
| `opt-settings` | `cmd-settings` |
| `opt-gateway` | `trace-pulse` |
| `opt-signal` | `trace-events` |
| `opt-audit` | (removed — becomes checklist in onboarding) |
| `utm-campanhas` | `trace-dashboard` |
| `utm-utms` | `trace-utms` |
| `utm-vendas` | `trace-vendas` |
| `utm-relatorios` | `trace-reports` |
| `utm-despesas` | `cmd-financial` |

### Riscos Phase 3
- **Risco ALTO**: Toda a navegacao muda. Se algum ID ficar inconsistente, componentes nao renderizam.
- **Mitigacao**: Manter aliases no `ModuleRouter` (case fallthrough dos IDs antigos → novos) por 1 release.
- **Rollback**: `git revert` do commit. Como nao ha persistencia de route IDs, reverter e seguro.

### Arquivos tocados: ~4 arquivos
```
src/App.tsx
src/components/Layout/TopNav.tsx
src/components/Layout/CommandBar.tsx
src/components/Layout/Sidebar.tsx
```

---

## PHASE 4 — Module Merging

**Objetivo**: Unificar modulos que agora compartilham o mesmo espaco conceitual.

### 4.1 — Trace Engine (UTM Studio + Signal Engine + Pulse Router)

**Criar**: `src/components/TraceEngine/TraceEngine.tsx`
- Tab interna com 3 sub-views:
  - "Dados" — tabela de UTMs/vendas (conteudo atual de UTMTracking)
  - "Sinais" — EMQ monitor, event log, value rules (conteudo atual de SignalEngine)
  - "Roteador" — gateway stats, pipeline, script (conteudo atual de SignalGateway)
- Importar sub-componentes existentes:
  - De `SignalEngine/`: `EMQMonitorAdvanced`, `EventLogPanel`, `ValueRulesPanel`, `TrackingScriptPanel`, `FunnelBuilder`
  - De `SignalGateway/`: extrair sub-componentes (atualmente e 1 arquivo monolitico)
  - De `UTMTracking/`: extrair sub-componentes (atualmente e 1 arquivo monolitico)

**NAO DELETAR** as pastas originais ainda. Manter como deprecated.

### 4.2 — Flow Builder (Pipeline + Command Set/Playbook)

**Criar**: `src/components/FlowBuilder/FlowBuilder.tsx`
- Layout: Sidebar com "etapas" do Pipeline (Andromeda, GEM, Auction, Delivery)
- Cada etapa pode expandir para mostrar conteudo educacional do Command Set (Playbook)
- Importar dados de `Pipeline.tsx` (stages[]) e `Playbook.tsx` (entries[])

### 4.3 — Shield Audit → Onboarding Checklist

**Mover** logica de `SignalAudit.tsx` para um componente reutilizavel:
- `src/components/shared/AuditChecklist.tsx`
- Usado no onboarding wizard (Phase 5)
- Usado como widget no dashboard principal (cmd-overview)
- NAO mais uma pagina separada

### 4.4 — Apex (rename only, no merge)

Apenas renomear folder:
- `src/components/Agent/` → `src/components/Apex/`
- `Agent.tsx` → `Apex.tsx`
- Atualizar import em `App.tsx`

### Riscos Phase 4
- **Risco ALTO**: Merging de componentes pode quebrar estados internos (useState, useEffect).
- **Mitigacao**: Cada merge em commit separado. Testar isoladamente.
- **Rollback**: Revert do commit de merge especifico.

### Arquivos criados/tocados: ~8 arquivos
```
src/components/TraceEngine/TraceEngine.tsx (NOVO)
src/components/FlowBuilder/FlowBuilder.tsx (NOVO)
src/components/shared/AuditChecklist.tsx (NOVO)
src/components/Apex/Apex.tsx (RENOMEADO de Agent.tsx)
src/App.tsx (atualizar imports e ModuleRouter)
```

---

## PHASE 5 — Onboarding Wizard

**Objetivo**: Experiencia de primeiro uso com 3 steps.

### 5.1 — Componente: `src/components/Onboarding/OnboardingWizard.tsx`

**Step 1 — Projeto**
- Nome do workspace
- Dominio (URL do site)
- Tipo de negocio (select: ecommerce, infoproduct, saas, leadgen, local)
- Salva em `workspaces` table

**Step 2 — O que rastrear**
- Checklist de eventos: PageView, ViewContent, Lead, InitiateCheckout, Purchase
- Toggle para eventos sinteticos: DeepEngagement, HighIntentVisitor, QualifiedLead
- Define `funnel_config` com base nas selecoes

**Step 3 — Para onde enviar**
- Pixel ID (input)
- CAPI Token (input com validacao)
- Gera script de tracking automaticamente
- Testa conexao (dry-run POST para CAPI)
- Inclui Shield Audit checklist (auditoria automatica)

### 5.2 — Integracao com fluxo existente

Em `App.tsx`, antes de renderizar o `ModuleRouter`:
```tsx
if (!currentWorkspace && workspaces.length === 0) {
  return <OnboardingWizard />;
}
```

### 5.3 — Zustand store additions
```ts
onboardingStep: number; // 0 = nao iniciado, 1-3 = steps, 4 = completo
setOnboardingStep: (step: number) => void;
```

### Riscos Phase 5
- **Risco MEDIO**: Se onboarding bloqueia acesso, usuario em demo mode nao consegue usar.
- **Mitigacao**: Em `mode: 'demo'`, skip onboarding automaticamente. Mostrar como sugestao, nao blocker.
- **Rollback**: Remover condicional no App.tsx, componente fica orfao mas nao quebra nada.

### Arquivos criados/tocados: ~4 arquivos
```
src/components/Onboarding/OnboardingWizard.tsx (NOVO)
src/components/Onboarding/StepProject.tsx (NOVO)
src/components/Onboarding/StepTracking.tsx (NOVO)
src/components/Onboarding/StepDestination.tsx (NOVO)
src/App.tsx (condicional de onboarding)
src/store/useStore.ts (onboarding state)
```

---

## Ordem Segura de Execucao

```
Phase 1 (labels) ─── ZERO RISCO ─── pode fazer agora
    │
Phase 2 (DB) ─── BAIXO RISCO ─── independente da UI
    │
Phase 3 (nav) ─── ALTO RISCO ─── depende de Phase 1 estar testada
    │
Phase 4 (merge) ─── ALTO RISCO ─── depende de Phase 3
    │
Phase 5 (onboard) ─── MEDIO RISCO ─── depende de Phase 2 + 4
```

**Recomendacao**: Phase 1 e Phase 2 podem rodar em paralelo (um e frontend, outro e backend). Phase 3+ e sequencial.

---

## O que NAO Mudar (Backward Compatibility)

1. **Nomes de tabelas Supabase** — NAO renomear `gateway_events` para `trace_events`. Muito arriscado. Manter nomes de tabelas e apenas mapear no service layer.
2. **Service filenames** — `gatewayService.ts`, `autoScaler.ts` podem manter os nomes. Re-export com novos nomes se necessario.
3. **Supabase Edge Functions** — `collect/`, `webhook-sales/`, `utmify-webhook/` mantem os mesmos paths. Renomear endpoint quebraria webhooks configurados.
4. **Chrome Extension** — Background.js e sidepanel.js nao precisam mudar. Comunicam via store.
5. **Types Meta** — `src/types/meta.ts` e `src/types/capi.ts` mantem as mesmas interfaces.
6. **Mock data** — `mockData.ts` e `capiMockData.ts` mantem nomes atuais.
7. **Mode demo** — Continua funcionando sem workspace. Workspace e apenas para mode live.

---

## Estimativa de Esforco

| Phase | Arquivos | Complexidade | Tempo estimado |
|-------|----------|-------------|----------------|
| 1 | ~9 | Trivial (find & replace) | 30 min |
| 2 | ~5 | Baixa (SQL + types) | 1-2h |
| 3 | ~4 | Alta (reestruturacao de nav) | 3-4h |
| 4 | ~8 | Alta (merge de componentes) | 4-6h |
| 5 | ~6 | Media (novo wizard) | 3-4h |
| **Total** | **~32** | | **12-17h** |
