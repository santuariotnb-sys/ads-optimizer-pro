# Guia de Setup — Ads Optimizer Pro (Tracking)

## Visão Geral

Existem **2 caminhos de tracking** no sistema. Você precisa de **apenas UM**:

| | Path A: Vercel API | Path B: Supabase Gateway |
|---|---|---|
| **Script** | `SignalEngine` (tracking.ts) | `AdsEdge` (gatewayService.ts) |
| **Backend** | Vercel `/api/capi/event` | Supabase Edge Function `/collect` |
| **Identity recovery** | Não | Sim (recupera email de visitas anteriores via _fbp) |
| **Purchase dedup por order_id** | Não | Sim |
| **Audit trail** | Não | Sim (gateway_events + audit_log) |
| **Observabilidade** | Básica | Completa (EMQ, dedup, coverage) |
| **Recomendado** | Testes rápidos | **Produção** |

**Use o Path B (Gateway/Supabase) para produção.** O Path A é útil para testes rápidos sem Supabase.

---

## Setup Completo (Path B — Recomendado)

### FASE 1: Infraestrutura (uma vez só)

#### 1.1 Supabase
```bash
# Se ainda não tem projeto Supabase, criar em https://supabase.com
# Depois rodar as migrations:
supabase db push
```

As migrations criam: `visitor_identities`, `purchases`, `funnel_config`, `gateway_events`, `gateway_audit_log`, `emq_daily` + views.

#### 1.2 Deploy Supabase Edge Functions
```bash
cd supabase/functions
supabase functions deploy collect
supabase functions deploy webhook-sales
supabase functions deploy utmify-webhook
supabase functions deploy subscription-webhook
```

#### 1.3 Vercel
```bash
# Env vars no Vercel (Settings → Environment Variables):
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
META_ACCESS_TOKEN=EAA...  # Token longo da Meta (System User Token)

# Deploy
vercel --prod
```

#### 1.4 .env local (desenvolvimento)
```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_META_APP_ID=seu_app_id
VITE_META_APP_SECRET=seu_app_secret
VITE_META_REDIRECT_URI=https://ads-optimizer-pro.vercel.app/auth/callback
```

---

### FASE 2: Configurar Funil (por produto)

1. Abrir o app → módulo **Pulse Router** (Signal Gateway)
2. Aba **"Configurar Funil"**
3. Preencher:
   - **Nome do Funil**: ex "Protocolo Detox"
   - **Tipo**: Infoproduto / Dropshipping / SaaS / etc
   - **Valores**: Front-end (R$), Bump 1 (R$ + taxa), Bump 2, Upsell, Downsell
   - **Pixel ID**: seu pixel Meta (ex: `123456789012345`)
   - **CAPI Token**: token de acesso da Conversions API (System User Token com permissão `ads_management`)
   - **Gateway URL**: deixar o padrão (`https://SEU_PROJETO.supabase.co/functions/v1/collect`) ou usar URL custom
4. Clicar **"Salvar Configuração"**
5. Anotar o **Funnel ID** gerado (aparece na URL ou no banco)

---

### FASE 3: Instalar na Landing Page

#### 3.1 Meta Pixel (OPCIONAL mas recomendado para dedup)

Colar no `<head>` da LP:
```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'SEU_PIXEL_ID');
fbq('track', 'PageView');
</script>
```

> **IMPORTANTE:** O script do Ads Optimizer Pro detecta automaticamente se o `fbq` está presente e dispara os eventos no Pixel com o mesmo `eventID` para deduplicação. Se o Pixel estiver instalado, você tem Pixel + CAPI. Se não estiver (ad blocker, Safari), o CAPI garante o tracking.

#### 3.2 Script do Ads Optimizer Pro (OBRIGATÓRIO)

1. No app → Pulse Router → aba **"Script da LP"**
2. Clicar **"Copiar Script"**
3. Colar **antes do `</body>`** da LP:

```html
<!-- Ads Optimizer Pro — Signal Gateway v2 -->
<script>
(function(){
"use strict";
var GW="https://SEU_PROJETO.supabase.co/functions/v1/collect";
var FID="SEU_FUNNEL_ID";
// ... (script gerado automaticamente)
window.AdsEdge.pageView();
})();
</script>
```

**O que esse script faz automaticamente:**
- Captura `fbclid` da URL → persiste como cookie `_fbc`
- Captura UTMs → persiste como cookie `_ao_utm` (30 dias)
- Gera/renova `_fbp` (com refresh para Safari ITP)
- Tracked: scroll depth, tempo na página, vídeo assistido
- Dispara `PageView` automaticamente
- Envia `PageLeave` com dados finais quando o visitante sai

---

### FASE 4: Disparar Eventos na LP

#### Eventos padrão (colar no JS da LP onde ocorre a ação):

```javascript
// Quando visitante vê conteúdo principal
AdsEdge.viewContent("Nome do Produto", ["produto-123"]);

// Quando visitante preenche lead form
AdsEdge.lead("email@cliente.com", "11999998888", "João Silva");

// Quando visitante clica em "Comprar"
AdsEdge.initiateCheckout(197.00, "Protocolo Detox", ["produto-123"]);

// Quando compra é aprovada (thank-you page OU webhook)
AdsEdge.purchase(
  197.00,              // valor
  "ORDER-ABC-123",     // order_id (OBRIGATÓRIO para dedup)
  "Protocolo Detox",   // nome do produto
  ["produto-123"],     // IDs dos itens
  1,                   // quantidade
  {                    // identidade (OPCIONAL mas melhora EMQ)
    email: "email@cliente.com",
    phone: "11999998888",
    first_name: "João",
    last_name: "Silva"
  }
);
```

#### Funnel multi-domínio (ex: LP → Checkout em outro domínio)

Na LP, antes dos links para o checkout:
```javascript
// Decora TODOS os links para o domínio do checkout
AdsEdge.decorateLinks("checkout.seudominio.com");
// Isso adiciona _fbp, _fbc e UTMs na query string automaticamente
```

Ou para um link específico:
```javascript
var url = AdsEdge.decorateUrl("https://checkout.seudominio.com/produto");
window.location.href = url;
```

---

### FASE 5: Testar (Meta Events Manager)

#### 5.1 Ativar Test Mode
```javascript
// No console do browser na LP:
AdsEdge.enableTestMode("TEST12345");
// ↑ Pegar o código em: Events Manager → Test Events → "Your server test events code"
```

#### 5.2 Verificar no Events Manager
1. Ir em **Events Manager → Test Events**
2. Abrir a LP em aba anônima
3. Navegar, scrollar, disparar eventos
4. No Events Manager deve aparecer:
   - ✅ `PageView` com `action_source: website`
   - ✅ `client_ip_address` preenchido (prova que o server enriqueceu)
   - ✅ `fbp` presente
   - ✅ `fbc` presente (se URL tinha `?fbclid=...`)
   - ✅ Tab "Deduplication" → match entre Pixel e CAPI pelo `event_id`
   - ✅ EMQ score visível

#### 5.3 Desativar Test Mode
```javascript
AdsEdge.disableTestMode();
```

#### 5.4 Debug rápido
```javascript
// Ver estado atual do tracking:
console.log(AdsEdge.getState());
// → { fbp: "fb.1...", fbc: "fb.1...", sid: "s_...", scroll: 72, time: 45, ... }
```

---

### FASE 6: Conectar Webhooks (checkout → backend)

Se você usa Hotmart/Kiwify/Eduzz, configure o webhook para garantir Purchase server-side:

| Plataforma | URL do Webhook | Autenticação |
|------------|---------------|-------------|
| **Kiwify** | `https://SEU_PROJETO.supabase.co/functions/v1/subscription-webhook` | Header `X-Webhook-Secret: SEU_SECRET` |
| **Hotmart/Eduzz** | `https://SEU_PROJETO.supabase.co/functions/v1/webhook-sales` | Header `X-Webhook-Secret: SEU_SECRET` |
| **Utmify** | `https://SEU_PROJETO.supabase.co/functions/v1/utmify-webhook?token=SEU_TOKEN` | Token na URL |

> **Por que webhooks ALÉM do script?** O script na thank-you page pode falhar (usuário fecha antes, redirect quebra). O webhook do checkout é a fonte de verdade. A tabela `purchases` deduplicada por `order_id` garante que não conta duas vezes.

---

### FASE 7: Monitorar (Dashboard)

No app → **Pulse Router** → aba **Dashboard**:

| Métrica | O que significa | Meta saudável |
|---------|----------------|--------------|
| **EMQ Score** | Qualidade do match (email, phone, fbp...) | ≥ 6.0 (ideal ≥ 8.0) |
| **Match Rate** | % eventos com email+phone | ≥ 40% |
| **Recovery** | Eventos capturados SÓ pelo CAPI (Pixel bloqueado) | > 0% (esse é o ROI do tracker) |
| **Delivery** | % eventos aceitos pela Meta | ≥ 95% |
| **Conversões Adicionais** | Eventos CAPI-only (ad blocker/Safari) | Esse número = conversões que você PERDERIA sem CAPI |
| **Dedup** | Eventos com Pixel + CAPI matched | Quanto maior, melhor |

---

## Checklist Rápido

- [ ] Supabase projeto criado + migrations rodadas
- [ ] Edge Functions deployed (`collect`, `webhook-sales`, etc)
- [ ] Vercel env vars configuradas (`META_ACCESS_TOKEN`, Supabase URLs)
- [ ] `vercel --prod` deployed
- [ ] Funil configurado no Pulse Router (Pixel ID + CAPI Token + valores)
- [ ] Meta Pixel instalado no `<head>` da LP (opcional mas recomendado)
- [ ] Script do Ads Optimizer Pro instalado antes do `</body>` da LP
- [ ] Eventos disparados no JS da LP (`AdsEdge.lead()`, `AdsEdge.purchase()`, etc)
- [ ] Test Events validado no Meta Events Manager
- [ ] Webhooks do checkout configurados (Hotmart/Kiwify/etc)
- [ ] Dashboard mostrando eventos reais
