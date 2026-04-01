# Apex → Claude Code: Abordagens de integração direta

## Problema atual

O Apex tem 3 modos de conexão:
1. **Bridge** — depende de browser extension (`window.agentBridge`) que não existe
2. **API** — chamada direta à Anthropic API pelo browser (inseguro, expõe key)
3. **Demo** — respostas hardcoded

Nenhum funciona de verdade. O Bridge é vaporware (a extensão nunca foi construída) e o API expõe a key no client.

---

## Abordagem 1: MCP Server (RECOMENDADA)

Claude Code já suporta MCP servers nativamente. Criamos um MCP server local que:
- Expõe tools: `analyze_campaigns`, `analyze_creatives`, `check_emq`, `signal_audit`
- Lê dados da Meta API (ou do mock em demo mode)
- Retorna dados estruturados que o Claude Code já sabe interpretar

### Arquitetura

```
Claude Code CLI
  └─ MCP Server (Node.js, local)
       ├─ Tool: analyze_campaigns(account_id)
       ├─ Tool: analyze_creatives(campaign_id)
       ├─ Tool: check_emq(account_id)
       ├─ Tool: signal_audit(account_id)
       ├─ Tool: get_dashboard_metrics(account_id)
       └─ Resource: system prompt com expertise Meta Ads
```

### Vantagens
- Zero dependência de browser extension
- Claude Code faz o raciocínio (não precisa de system prompt manual)
- Tools são composáveis — Claude decide quando chamar cada uma
- Funciona no terminal, IDE, web — qualquer client Claude Code
- API key fica segura no server-side

### Implementação
- `src/mcp-server/index.ts` — server MCP com `@modelcontextprotocol/sdk`
- Reutiliza `metaApi.ts`, `alertEngine.ts`, `entityDetector.ts` como tools
- Config em `.claude/settings.json` para auto-load

### Esforço: ~2-3 sessões

---

## Abordagem 2: Custom Skill (Claude Code)

Criar um skill file (`.claude/skills/apex.md`) que transforma qualquer conversa Claude Code num consultor Meta Ads.

### Arquitetura

```
Claude Code CLI
  └─ /apex (skill invocation)
       ├─ Lê dados do projeto (store, mock data)
       ├─ Injeta system prompt de Meta Ads
       └─ Usa ferramentas existentes (Read, Bash) para acessar dados
```

### Vantagens
- Setup instantâneo (é só um arquivo .md)
- Sem código novo — reutiliza tools nativos do Claude Code
- Fácil de iterar no prompt

### Limitações
- Não acessa Meta API em tempo real (só dados do projeto)
- Menos estruturado que MCP tools
- System prompt precisa ser mantido manualmente

### Esforço: ~30 min

---

## Abordagem 3: Agent SDK (standalone)

Usar o Claude Agent SDK para criar um agente Apex standalone que roda como processo.

### Arquitetura

```
apex-agent (processo Node.js)
  ├─ Claude Agent SDK
  ├─ Tools customizadas (Meta API, CAPI, Entity Detection)
  ├─ System prompt com expertise
  └─ Output: terminal ou webhook para o app React
```

### Vantagens
- Agente autônomo com loop de raciocínio completo
- Pode executar ações (pausar campanha, ajustar budget)
- Integrável via API com qualquer frontend

### Limitações
- Mais complexo de implementar
- Precisa de infra separada para rodar
- Overkill se o objetivo é só consultoria/análise

### Esforço: ~4-5 sessões

---

## Abordagem 4: Híbrida (MCP + Skill + React)

A mais completa: MCP server fornece os dados, skill configura o persona, React app consome via local HTTP.

```
React App (Apex UI)
  └─ fetch('http://localhost:3847/...')
       └─ MCP Server
            └─ Claude Code (via Agent SDK ou CLI subprocess)
```

O React app mantém a UI glassmorphism mas o backend é o MCP server.

---

## Recomendação

**Começar com Abordagem 2 (Skill)** — 30 min, valida o conceito.
**Evoluir para Abordagem 1 (MCP Server)** — versão production com tools reais.

### Plano de execução

| Fase | O que | Resultado |
|------|-------|-----------|
| 1 | Skill `/apex` com system prompt e mock data | Apex funciona no terminal |
| 2 | MCP Server com tools de análise | Apex acessa dados reais |
| 3 | React app conecta ao MCP server | UI existente funciona sem bridge |
| 4 | (Opcional) Agent SDK para ações autônomas | Apex executa otimizações |

### O que muda no Agent.tsx

O `ConnectionMode` muda de `'bridge' | 'api' | 'demo'` para:
- `'mcp'` — conectado ao MCP server local (substitui bridge + api)
- `'demo'` — mantém fallback com respostas mock

O `localBridgeClient.ts` é substituído por um `mcpClient.ts` que faz HTTP para o MCP server local.
