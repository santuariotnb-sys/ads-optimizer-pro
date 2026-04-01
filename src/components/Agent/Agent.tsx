import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Sparkles, Target, Image as ImageIcon, Play, Cpu, Radio, X, Wifi, WifiOff, Terminal } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useStore } from '../../store/useStore';
import { AIAgent } from '../../services/aiAgent';
import { localBridge, type BridgeStatus, type TaskHandle } from '../../services/localBridgeClient';
import { mcpBridge, type McpBridgeStatus } from '../../services/mcpClient';
import type { CreativeAnalysisResult } from '../../services/creativeVision';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type ConnectionMode = 'mcp' | 'bridge' | 'api' | 'demo';

const quickTopics = [
  { id: 'overview', label: 'Visao Geral', icon: Sparkles, question: 'Faca uma analise geral da minha conta de anuncios.' },
  { id: 'bidding', label: 'Estrategia de Lances', icon: Target, question: 'Qual a melhor estrategia de lances para minhas campanhas atuais?' },
  { id: 'creatives', label: 'Analise de Criativos', icon: ImageIcon, question: 'Analise meus criativos e identifique oportunidades.' },
  { id: 'hooks', label: 'Analise de Hooks', icon: Play, question: 'Como posso melhorar os hooks dos meus videos?' },
  { id: 'andromeda', label: 'Andromeda/Algoritmo', icon: Cpu, question: 'Explique como o Andromeda esta afetando minhas campanhas.' },
  { id: 'signal', label: 'Signal Engineering', icon: Radio, question: 'Como posso melhorar meu Signal Engineering e EMQ?' },
];

const demoResponses: Record<string, string> = {
  overview: `**Analise Geral da Conta**

Sua conta esta com Score 74/100, o que e considerado "Bom" mas com espaco significativo para melhoria.

**Pontos Positivos:**
- CPA geral de R$ 52,40 esta dentro do alvo
- ROAS de 3.24x e saudavel para o segmento
- Campanha [ASC] Protocolo Detox e uma estrela com ROAS 3.82x e Opportunity Score 87
- Campanha [RETARGET] Carrinho Abandonado entrega ROAS 5.21x

**Pontos de Atencao:**
- Campanha [CBO] Colageno Premium esta operando com ROAS 0.82 (negativo). Recomendo pausar imediatamente.
- Campanha [ASC] Black Friday esta em Learning Limited ha 18 dias com apenas 35/50 conversoes. Considere consolidar ad sets.
- EMQ esta em 6.8, abaixo do ideal (8.0+). Isso esta aumentando seu CPA em ~11%.
- 4 criativos com mais de 10 dias ativos -- novelty bias esta erodindo performance.

**Acao Imediata:** Pausar Colageno Premium, escalar Protocolo Detox +10%, e corrigir CAPI para subir EMQ.`,

  bidding: `**Estrategia de Lances Recomendada**

Analisando suas 6 campanhas, recomendo a seguinte abordagem:

**Campanhas de Performance (Detox, Skincare):**
Mantenha LOWEST_COST_WITHOUT_CAP. Com CPA de R$ 42,50 e R$ 58,30 respectivamente, o algoritmo esta encontrando bons clusters. Forcar um bid cap poderia limitar o aprendizado do Andromeda.

**Retargeting (Carrinho Abandonado):**
Com ROAS 5.21x, considere mudar para COST_CAP com cap em R$ 35. Isso permitira escalar sem perder eficiencia. A frequencia de 3.2 indica que o publico esta saturando -- expanda a janela de 7d para 14d.

**Campanhas Novas (Whey):**
Em learning phase, NUNCA altere o bid strategy. O Andromeda precisa de estabilidade. Espere completar 50 conversoes/semana. Com 22/50, faltam ~4 dias se manter o ritmo.

**Advantage+ Sales:**
Para suas campanhas ASC, o broad targeting e correto. O GEM esta entregando +5% conversoes no Instagram -- garanta que seus criativos estejam otimizados para IG Reels (formato que mais performa). O investimento ideal para Advantage+ e entre R$ 500-800/dia para manter o aprendizado estavel.`,

  creatives: `**Analise de Criativos + Entity IDs**

Voce tem 24 criativos distribuidos em 5 Entity IDs. Isso e bom, mas ha problemas:

**Entity ID #2 (Statics -- Antes/Depois) -- SUPERLOTADO:**
5 criativos com similaridade visual >60%. O Andromeda esta usando apenas 1 ticket no leilao para todos eles. Voce esta pagando para produzir 5 criativos mas obtendo a chance de apenas 1.

**Winners Identificados:**
- "Reels -- Trend Sound Detox" (Score 96): Hook Rate 48%, CPA R$ 32. ESCALE JA!
- "UGC -- Influencer Detox" (Score 95): Hook Rate 45%, Hold Rate 62%. Perfeito.
- "UGC -- Resultados 30 dias" (Score 93): Novissimo (2 dias), excelente performance.

**Losers para Pausar:**
- "Carrossel -- 5 Produtos Top" (Score 22): CTR 0.8%, CPA R$ 120. Pausar imediatamente.
- "Static -- Comparativo Preco" (Score 18): CTR 0.7%, 13 dias ativo. Morto.

**Fadiga Detectada:**
- "Static -- Antes/Depois Detox" (12 dias): CPM subiu de R$ 28 para R$ 35.20 (+25%). Substituir por novo Entity ID.

**Recomendacao:** Crie 3 novos criativos em formatos diferentes (UGC testemunho, Reels trend, Motion 3D) para adicionar novos Entity IDs ao leilao.`,

  hooks: `**Analise de Hooks -- O que esta funcionando**

Analisei o Hook Rate (3s views / impressoes) e Hold Rate (ThruPlay / 3s views) dos seus criativos:

**Top Hooks (>40% Hook Rate):**
1. "Reels -- Trend Sound" (48%): Musica trend + corte rapido nos primeiros 0.5s. O pattern interrupt e forte.
2. "UGC -- Influencer Detox" (45%): Pessoa real falando direto com a camera + expressao de surpresa.
3. "UGC -- Resultados 30 dias" (43%): Antes/depois com transicao rapida.
4. "VSL Detox -- Hook Curiosidade" (42%): Pergunta provocativa nos primeiros 2s.

**Padrao dos Winners:** Todos usam os primeiros 0.5-1s para pattern interrupt (som, movimento, pergunta). O Hold Rate acima de 55% indica que o conteudo apos o hook entrega valor.

**Hooks que Falham (<25%):**
- Carrosseis tem hook rate medio de 18% -- formato desfavorecido pelo algoritmo
- Statics de produto puro (sem face humana) ficam abaixo de 25%

**Recomendacao para novos hooks:**
1. "Voce nao vai acreditar no que aconteceu..." (curiosity gap)
2. Audio trend do momento + visual inesperado
3. Close-up em resultado real + corte para produto
4. Depoimento emocional nos primeiros 3s

Lembre-se: o Meta analisa os primeiros 3 segundos para determinar a qualidade do criativo. Um hook fraco significa CPM mais alto e alcance menor.`,

  andromeda: `**Como o Andromeda esta afetando suas campanhas**

O Andromeda e o retrieval engine do Meta -- ele filtra bilhoes de ads para ~1.000 candidatos em <200ms usando o NVIDIA Grace Hopper Superchip + MTIA v2.

**Impacto na sua conta:**

1. **Entity ID Clustering:** Seus 24 criativos estao agrupados em 5 Entity IDs. O Entity #2 (statics) esta superlotado com 5 criativos -- o Andromeda ve todos como "o mesmo ad" e usa 1 ticket. Voce tem efetivamente 4 chances no leilao, nao 5.

2. **GEM Ranking:** Desde Q2 2025, o GEM (escala GPT-4) rankeia seus ads. Ele aprende cross-platform (IG<>FB). Seus UGCs estao performando melhor no IG (+5% conv) enquanto VSLs performam melhor no FB Feed (+3%).

3. **Broad vs Interesses:** Sua campanha Broad (Detox, Score 87) supera a de Interesses (Colageno, Score 28) por uma margem enorme. O Andromeda e MELHOR que voce em encontrar publicos -- broad targeting e o caminho.

4. **Learning Phase:** A campanha Whey (8 dias, 22/50 conv) precisa de mais volume. O Andromeda calibra nos primeiros 50 conversoes/semana. Abaixo disso = "foto borrada".

**Acao:** Mate a campanha de interesses (Colageno), diversifique Entity IDs, e confie no broad targeting. O Andromeda + GEM em 2025 e absurdamente mais inteligente que segmentacao manual.`,

  signal: `**Signal Engineering -- Seu Maior Gargalo**

Seu EMQ esta em 6.8/10. Isso significa que o Andromeda esta recebendo uma "foto borrada" dos seus clientes. Voce esta no Nivel 2 (CAPI basico) -- 90% dos anunciantes estao aqui.

**Breakdown do seu EMQ:**
- Email: 2.0/2.0
- Phone: 1.5/1.5
- External ID: 1.5/1.5
- IP + User Agent: 1.0/1.0
- FBP (browser cookie): 0.5/0.5
- FBC (click ID): 0.3/0.5 -- Voce esta perdendo 0.2 por nao capturar todos os fbc

**Para subir para Nivel 4 (EMQ 8.5+):**
Adicione estes campos no custom_data do CAPI:
- predicted_ltv: valor previsto de LTV do cliente
- margin_tier: "high", "medium", "low" baseado na margem
- engagement_score: 0-10 baseado no comportamento

**Impacto estimado:** EMQ 6.8 -> 8.4 = CPA -11% (dados reais de case study). Para seu CPA de R$ 52,40, isso significaria R$ 46,64 -- economia de R$ 5,76 por conversao x 878 conv/semana = R$ 5.057/semana.

**Synthetic Events (Nivel 5):**
Implemente DeepEngagement (scroll 75% + 2min na LP) e HighIntentVisitor (3 visitas em 48h) via CAPI. Apenas 0.01% dos anunciantes fazem isso. Isso ensina o Andromeda comportamentos pre-compra que ele nao consegue ver sozinho.`,
};

/** Safe markdown renderer — returns React elements instead of raw HTML */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const isBullet = /^- (.+)/.exec(line);
    const content = isBullet ? isBullet[1] : line;

    // Split by **bold** markers and build React elements
    const parts = content.split(/(\*\*.*?\*\*)/g).map((part, j) => {
      const boldMatch = /^\*\*(.*)\*\*$/.exec(part);
      if (boldMatch) {
        return <strong key={j} style={{ color: '#0f172a', fontWeight: 600 }}>{boldMatch[1]}</strong>;
      }
      return <span key={j}>{part}</span>;
    });

    if (isBullet) {
      return (
        <div key={i} style={{ display: 'flex', gap: 6, paddingLeft: 4 }}>
          <span style={{ flexShrink: 0 }}>{'\u2022'}</span>
          <span>{parts}</span>
        </div>
      );
    }

    // Empty line = spacing
    if (line.trim() === '') {
      return <div key={i} style={{ height: 8 }} />;
    }

    return <div key={i}>{parts}</div>;
  });
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxHeight: 'calc(100vh - 120px)',
  background: 'rgba(255,255,255,.34)',
  backdropFilter: 'blur(28px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,.55)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '20px 24px 16px',
  borderBottom: '1px solid rgba(15,23,42,0.08)',
  background: 'rgba(255,255,255,.2)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

const messagesContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  scrollBehavior: 'smooth',
};

const inputContainerStyle: React.CSSProperties = {
  padding: '16px 24px 20px',
  borderTop: '1px solid rgba(15,23,42,0.08)',
  background: 'rgba(255,255,255,.2)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

const inputWrapperStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  background: 'rgba(15,23,42,0.03)',
  border: '1px solid rgba(15,23,42,0.1)',
  borderRadius: 12,
  padding: '10px 12px 10px 16px',
  minHeight: 44,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  transition: 'border-color 0.2s ease',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#0f172a',
  fontSize: 14,
  fontFamily: 'inherit',
  resize: 'none',
  lineHeight: 1.5,
};

const sendButtonStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 10,
  border: 'none',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
};

const topicPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  minHeight: 44,
  borderRadius: 20,
  border: '1px solid rgba(99,102,241,0.25)',
  background: 'rgba(99,102,241,0.08)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: '#8b5cf6',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
};

const userMessageStyleBase: React.CSSProperties = {
  alignSelf: 'flex-end',
  padding: '12px 16px',
  borderRadius: '16px 16px 4px 16px',
  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  color: '#fff',
  fontSize: 14,
  lineHeight: 1.6,
  boxShadow: '0 2px 16px rgba(99,102,241,0.25)',
};

const assistantMessageStyleBase: React.CSSProperties = {
  alignSelf: 'flex-start',
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
};

const assistantBubbleStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderRadius: '16px 16px 16px 4px',
  background: 'rgba(255,255,255,.34)',
  border: '1px solid rgba(255,255,255,.55)',
  color: '#334155',
  fontSize: 14,
  lineHeight: 1.7,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

const botAvatarStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
};

const typingDotsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  padding: '14px 18px',
  borderRadius: '16px 16px 16px 4px',
  background: 'rgba(255,255,255,.34)',
  border: '1px solid rgba(255,255,255,.55)',
};

const typingKeyframes = `
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}
`;

const SESSION_KEY = 'ao_anthropic_key';

function getAnthropicKey(): string | null {
  return sessionStorage.getItem(SESSION_KEY) || import.meta.env.VITE_ANTHROPIC_API_KEY || null;
}

/** Build context string from store data for bridge prompts */
function buildBridgeContext(
  campaignCount: number,
  cpa: number,
  roas: number,
  emq: number,
): string {
  return [
    'Contexto: App Ads.Everest. Dados atuais do gestor de trafego:',
    `- Campanhas ativas: ${campaignCount}`,
    `- CPA medio: R$ ${(cpa ?? 0).toFixed(2)}`,
    `- ROAS medio: ${(roas ?? 0).toFixed(2)}x`,
    `- EMQ Score: ${(emq ?? 0).toFixed(1)}`,
    '',
  ].join('\n');
}

/** Extract text content from streaming event */
function extractStreamText(event: unknown): string | null {
  if (!event || typeof event !== 'object') return null;
  const evt = event as Record<string, unknown>;

  // Handle stream-json format from claude CLI
  if (evt.type === 'assistant' && evt.message && typeof evt.message === 'object') {
    const msg = evt.message as Record<string, unknown>;
    if (Array.isArray(msg.content)) {
      return (msg.content as Array<Record<string, unknown>>)
        .filter((b) => b.type === 'text')
        .map((b) => String(b.text ?? ''))
        .join('');
    }
  }

  // Handle content_block_delta
  if (evt.type === 'content_block_delta' && evt.delta && typeof evt.delta === 'object') {
    const delta = evt.delta as Record<string, unknown>;
    if (delta.type === 'text_delta' && typeof delta.text === 'string') {
      return delta.text;
    }
  }

  // Handle result event
  if (evt.type === 'result' && typeof evt.result === 'string') {
    return evt.result;
  }

  // Fallback: if event has a text field
  if (typeof evt.text === 'string') return evt.text;

  return null;
}

export default function Agent() {
  const isMobile = useIsMobile();
  const metrics = useStore((s) => s.metrics);
  const campaigns = useStore((s) => s.campaigns);
  const emqScore = useStore((s) => s.emqScore);
  const creativeAnalysisContext = useStore((s) => s.creativeAnalysisContext);
  const setCreativeAnalysisContext = useStore((s) => s.setCreativeAnalysisContext);
  const creativeContextRef = useRef<CreativeAnalysisResult | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `**Ola! Sou o Apex, seu Consultor de Ads com IA.**

Posso analisar suas campanhas, criativos, estrategias de lances e muito mais. Tenho acesso aos dados da sua conta e conhego profundamente o algoritmo do Meta (Andromeda + GEM).

Escolha um dos topicos abaixo ou digite sua pergunta:`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [hoveredSend, setHoveredSend] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);

  // Bridge state
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [bridgeChecked, setBridgeChecked] = useState(false);
  const activeTaskRef = useRef<TaskHandle | null>(null);
  const [hasActiveTask, setHasActiveTask] = useState(false);
  const streamBufferRef = useRef('');

  // MCP state
  const [mcpStatus, setMcpStatus] = useState<McpBridgeStatus | null>(null);

  // Determine connection mode — MCP first, then bridge, api, demo
  const connectionMode: ConnectionMode = (() => {
    if (mcpStatus?.available) return 'mcp';
    if (bridgeStatus?.available && bridgeStatus.authenticated) return 'bridge';
    if (getAnthropicKey()) return 'api';
    return 'demo';
  })();

  // Check MCP bridge + legacy bridge status on mount
  useEffect(() => {
    let cancelled = false;

    // Check MCP bridge first (fast, 2s timeout)
    mcpBridge.getStatus().then((status) => {
      if (!cancelled) setMcpStatus(status);
    });

    // Also check legacy bridge
    localBridge.getStatus().then((status) => {
      if (!cancelled) {
        setBridgeStatus(status);
        setBridgeChecked(true);
      }
    });

    return () => { cancelled = true; };
  }, []);

  // Injetar contexto de analise de criativo quando vier do CreativeVision
  useEffect(() => {
    if (!creativeAnalysisContext) return;
    creativeContextRef.current = creativeAnalysisContext;

    const ctxMsg: Message = {
      id: `assistant-ctx-${++msgIdRef.current}`,
      role: 'assistant',
      content: `**Analise de Criativo Carregada**

Recebi os dados da analise do seu criativo:
- **Score geral:** ${creativeAnalysisContext.score}/100
- **Hook:** ${creativeAnalysisContext.hookType} (${creativeAnalysisContext.hookScore}/10)
- **CTA:** ${creativeAnalysisContext.ctaType} (${creativeAnalysisContext.ctaScore}/10)
- **Tom:** ${creativeAnalysisContext.tone}
- **Insights:** ${creativeAnalysisContext.insights.length} pontos identificados

Pergunte qualquer coisa sobre este criativo -- posso sugerir melhorias, analisar pontos fracos ou criar variacoes.`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, ctxMsg]);
    setCreativeAnalysisContext(null);
  }, [creativeAnalysisContext, setCreativeAnalysisContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addAssistantMessage = (content: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${++msgIdRef.current}`,
          role: 'assistant',
          content,
          timestamp: new Date(),
        },
      ]);
    }, 800);
  };

  const sendToAI = useCallback(async (userMessage: string): Promise<string | null> => {
    const apiKey = getAnthropicKey();
    if (!apiKey) return null;
    try {
      const agent = new AIAgent(apiKey);
      const response = await agent.sendMessage(userMessage, { metrics, campaigns, emqScore, creativeAnalysis: creativeContextRef.current });
      return response;
    } catch {
      return null;
    }
  }, [metrics, campaigns, emqScore]);

  const sendViaMcp = useCallback(async (userMessage: string): Promise<string | null> => {
    try {
      const response = await mcpBridge.chat(userMessage, {
        cpa: metrics.cpa,
        roas: metrics.roas,
        ctr: metrics.ctr,
        cpm: metrics.cpm,
        spend: metrics.spend,
        conversions: metrics.conversions,
        accountScore: metrics.accountScore,
        emqScore: emqScore,
      });
      return response;
    } catch {
      return null;
    }
  }, [metrics, emqScore]);

  const sendViaBridge = useCallback((userMessage: string) => {
    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
    const context = buildBridgeContext(
      activeCampaigns || campaigns.length,
      metrics.cpa,
      metrics.roas,
      emqScore,
    );
    const fullPrompt = `${context}\nTarefa do usuario: ${userMessage}`;

    streamBufferRef.current = '';
    const streamMsgId = `assistant-${++msgIdRef.current}`;

    // Add empty assistant message that will be filled via streaming
    setMessages((prev) => [
      ...prev,
      { id: streamMsgId, role: 'assistant', content: '', timestamp: new Date() },
    ]);

    const task = localBridge.sendTask({
      prompt: fullPrompt,
      onStream: (event) => {
        const text = extractStreamText(event);
        if (text) {
          streamBufferRef.current += text;
          const currentContent = streamBufferRef.current;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamMsgId ? { ...m, content: currentContent } : m,
            ),
          );
        }
      },
      onDone: (result) => {
        setIsTyping(false);
        activeTaskRef.current = null;
        setHasActiveTask(false);
        if (result.cancelled) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamMsgId
                ? { ...m, content: m.content + '\n\n*[Cancelado pelo usuario]*' }
                : m,
            ),
          );
        }
        // If no content was streamed, show a fallback
        if (!streamBufferRef.current.trim()) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamMsgId
                ? { ...m, content: 'Nao foi possivel obter resposta do Claude Code. Tente novamente.' }
                : m,
            ),
          );
        }
      },
      onError: (err) => {
        setIsTyping(false);
        activeTaskRef.current = null;
        setHasActiveTask(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamMsgId
              ? { ...m, content: `**Erro:** ${err.message}` }
              : m,
          ),
        );
      },
    });

    activeTaskRef.current = task;
    setHasActiveTask(true);
  }, [campaigns, metrics, emqScore]);

  const handleCancelTask = useCallback(() => {
    if (activeTaskRef.current) {
      activeTaskRef.current.cancel();
      activeTaskRef.current = null;
      setHasActiveTask(false);
    }
  }, []);

  const handleTopicClick = (topicId: string, question: string) => {
    const userMsg: Message = {
      id: `user-${++msgIdRef.current}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    if (connectionMode === 'mcp') {
      setIsTyping(true);
      sendViaMcp(question).then((mcpResponse) => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${++msgIdRef.current}`,
            role: 'assistant',
            content: mcpResponse || demoResponses[topicId] || 'Desculpe, nao tenho uma resposta para isso ainda.',
            timestamp: new Date(),
          },
        ]);
      });
    } else if (connectionMode === 'bridge') {
      setIsTyping(true);
      sendViaBridge(question);
    } else if (connectionMode === 'api') {
      setIsTyping(true);
      sendToAI(question).then((aiResponse) => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${++msgIdRef.current}`,
            role: 'assistant',
            content: aiResponse || demoResponses[topicId] || 'Desculpe, nao tenho uma resposta para isso ainda.',
            timestamp: new Date(),
          },
        ]);
      });
    } else {
      addAssistantMessage(demoResponses[topicId] || 'Desculpe, nao tenho uma resposta para isso ainda.');
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const trimmed = input.trim();
    const userMsg: Message = {
      id: `user-${++msgIdRef.current}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    if (connectionMode === 'mcp') {
      setIsTyping(true);
      sendViaMcp(trimmed).then((mcpResponse) => {
        setIsTyping(false);
        if (mcpResponse) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${++msgIdRef.current}`,
              role: 'assistant',
              content: mcpResponse,
              timestamp: new Date(),
            },
          ]);
        } else {
          addAssistantMessage(
            `**Erro de conexão com o Apex MCP Server.** Verifique se o servidor está rodando:\n\n\`cd ads-optimizer-pro && npx tsx mcp-server/src/http-bridge.ts\``
          );
        }
      });
    } else if (connectionMode === 'bridge') {
      setIsTyping(true);
      sendViaBridge(trimmed);
    } else if (connectionMode === 'api') {
      setIsTyping(true);
      sendToAI(trimmed).then((aiResponse) => {
        setIsTyping(false);
        if (aiResponse) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${++msgIdRef.current}`,
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date(),
            },
          ]);
        } else {
          // AI call failed, fall back to demo
          const matchedTopic = quickTopics.find(
            (t) =>
              trimmed.toLowerCase().includes(t.label.toLowerCase()) ||
              trimmed.toLowerCase().includes(t.id.toLowerCase())
          );
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${++msgIdRef.current}`,
              role: 'assistant',
              content: matchedTopic
                ? demoResponses[matchedTopic.id]
                : `**Analise Personalizada**\n\nBaseado na sua pergunta, identifiquei os seguintes pontos relevantes:\n\n- Seu CPA medio de R$ 52,40 pode ser otimizado em ate 15% com ajustes no Signal Engineering (EMQ atual: 6.8)\n- Recomendo focar em criativos UGC que apresentam Hook Rate 45%+ versus statics com apenas 18%\n- O Andromeda favorece broad targeting -- campanhas sem segmentacao manual estao performando 3.2x melhor\n\nPara uma analise mais detalhada, selecione um dos topicos disponiveis acima.`,
              timestamp: new Date(),
            },
          ]);
        }
      });
    } else {
      // No API key and no bridge — use demo responses
      const matchedTopic = quickTopics.find(
        (t) =>
          trimmed.toLowerCase().includes(t.label.toLowerCase()) ||
          trimmed.toLowerCase().includes(t.id.toLowerCase())
      );
      if (matchedTopic) {
        addAssistantMessage(demoResponses[matchedTopic.id]);
      } else {
        addAssistantMessage(
          `**Analise Personalizada**\n\nBaseado na sua pergunta, identifiquei os seguintes pontos relevantes:\n\n- Seu CPA medio de R$ 52,40 pode ser otimizado em ate 15% com ajustes no Signal Engineering (EMQ atual: 6.8)\n- Recomendo focar em criativos UGC que apresentam Hook Rate 45%+ versus statics com apenas 18%\n- O Andromeda favorece broad targeting -- campanhas sem segmentacao manual estao performando 3.2x melhor\n\nPara uma analise mais detalhada, selecione um dos topicos disponiveis acima.`
        );
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Connection status badge
  const renderConnectionBadge = () => {
    if (!bridgeChecked && !mcpStatus) return null;

    if (connectionMode === 'mcp') {
      const isLive = mcpStatus?.mode === 'live';
      return (
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            background: isLive ? 'rgba(74,222,128,0.1)' : 'rgba(99,102,241,0.1)',
            border: `1px solid ${isLive ? 'rgba(74,222,128,0.2)' : 'rgba(99,102,241,0.2)'}`,
          }}
        >
          <Terminal size={12} style={{ color: isLive ? '#4ade80' : '#6366f1' }} />
          <span style={{ fontSize: 11, color: isLive ? '#4ade80' : '#6366f1', fontWeight: 500 }}>
            {isLive ? 'Apex Live' : 'Apex Server'}
          </span>
        </div>
      );
    }

    if (connectionMode === 'bridge') {
      return (
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.2)',
          }}
        >
          <Terminal size={12} style={{ color: '#4ade80' }} />
          <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 500 }}>Claude Code</span>
        </div>
      );
    }

    if (bridgeStatus?.available && !bridgeStatus.authenticated) {
      return (
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            background: 'rgba(250,204,21,0.1)',
            border: '1px solid rgba(250,204,21,0.2)',
          }}
          title="Execute `claude` no terminal para fazer login"
        >
          <WifiOff size={12} style={{ color: '#facc15' }} />
          <span style={{ fontSize: 11, color: '#facc15', fontWeight: 500 }}>Login necessario</span>
        </div>
      );
    }

    if (connectionMode === 'api') {
      return (
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <Wifi size={12} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 500 }}>API Key</span>
        </div>
      );
    }

    return (
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 20,
          background: 'rgba(148,163,184,0.1)',
          border: '1px solid rgba(148,163,184,0.2)',
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#94a3b8',
          }}
        />
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Demo</span>
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      <style>{typingKeyframes}</style>

      {/* Header */}
      <div style={{ ...headerStyle, padding: isMobile ? '14px 16px 12px' : '20px 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isMobile ? 12 : 16 }}>
          <div style={botAvatarStyle}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: '#0f172a',
                letterSpacing: '-0.01em',
              }}
            >
              Apex
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              Analise inteligente das suas campanhas Meta Ads
            </p>
          </div>
          {renderConnectionBadge()}
        </div>

        {/* Bridge instructions when available but not authenticated */}
        {bridgeStatus?.available && !bridgeStatus.authenticated && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(250,204,21,0.08)',
            border: '1px solid rgba(250,204,21,0.15)',
            marginBottom: 12,
            fontSize: 12,
            color: '#92400e',
            lineHeight: 1.5,
          }}>
            <strong>Agent Bridge detectado.</strong> Execute <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>claude</code> no terminal para fazer login e ativar o modo local.
          </div>
        )}

        {/* Quick Topics */}
        <div
          style={{
            display: isMobile ? 'grid' : 'flex',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : undefined,
            flexWrap: isMobile ? undefined : 'wrap',
            gap: 8,
            overflowX: isMobile ? 'auto' : undefined,
          }}
        >
          {quickTopics.map((topic) => {
            const Icon = topic.icon;
            const isHovered = hoveredTopic === topic.id;
            return (
              <button
                key={topic.id}
                style={{
                  ...topicPillStyle,
                  background: isHovered
                    ? 'rgba(99,102,241,0.18)'
                    : 'rgba(99,102,241,0.08)',
                  borderColor: isHovered
                    ? 'rgba(99,102,241,0.45)'
                    : 'rgba(99,102,241,0.25)',
                  transform: isHovered ? 'translateY(-1px)' : 'none',
                  boxShadow: isHovered ? '0 4px 12px rgba(99,102,241,0.15)' : 'none',
                }}
                onClick={() => handleTopicClick(topic.id, topic.question)}
                onMouseEnter={() => setHoveredTopic(topic.id)}
                onMouseLeave={() => setHoveredTopic(null)}
              >
                <Icon size={14} />
                {topic.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} role="log" aria-label="Mensagens do chat" style={{ ...messagesContainerStyle, padding: isMobile ? '14px 12px' : '20px 24px' }}>
        {messages.map((msg) =>
          msg.role === 'user' ? (
            <div key={msg.id} style={{ ...userMessageStyleBase, maxWidth: isMobile ? '90%' : '75%' }}>
              <span>{msg.content}</span>
            </div>
          ) : (
            <div key={msg.id} style={{ ...assistantMessageStyleBase, maxWidth: isMobile ? '90%' : '85%' }}>
              <div style={botAvatarStyle}>
                <Bot size={16} color="#fff" />
              </div>
              <div style={assistantBubbleStyle}>
                {renderMarkdown(msg.content)}
              </div>
            </div>
          )
        )}

        {/* Typing Indicator */}
        {isTyping && !hasActiveTask && (
          <div style={assistantMessageStyleBase} aria-live="polite">
            <div style={botAvatarStyle}>
              <Bot size={16} color="#fff" />
            </div>
            <div style={typingDotsContainerStyle}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#6366f1',
                    animation: `typingBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ ...inputContainerStyle, padding: isMobile ? '12px 12px 14px' : '16px 24px 20px' }}>
        <div
          style={{
            ...inputWrapperStyle,
            borderColor: inputFocused
              ? 'rgba(99,102,241,0.4)'
              : 'rgba(15,23,42,0.1)',
            boxShadow: inputFocused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Pergunte sobre suas campanhas..."
            rows={1}
            style={inputStyle}
          />
          {hasActiveTask ? (
            <button
              onClick={handleCancelTask}
              aria-label="Cancelar tarefa"
              style={{
                ...sendButtonStyle,
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: '0 2px 12px rgba(239,68,68,0.3)',
              }}
            >
              <X size={16} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              onMouseEnter={() => setHoveredSend(true)}
              onMouseLeave={() => setHoveredSend(false)}
              aria-label="Enviar mensagem"
              style={{
                ...sendButtonStyle,
                transform: hoveredSend ? 'scale(1.05)' : 'scale(1)',
                boxShadow: hoveredSend
                  ? '0 4px 20px rgba(99,102,241,0.45)'
                  : '0 2px 12px rgba(99,102,241,0.3)',
              }}
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 11,
            color: '#475569',
            textAlign: 'center',
          }}
        >
          {connectionMode === 'mcp'
            ? `Apex MCP Server ${mcpStatus?.mode === 'live' ? '— Claude API ativa' : '— modo local'}`
            : connectionMode === 'bridge'
              ? 'Claude Code conectado localmente via Agent Bridge'
              : connectionMode === 'api'
                ? 'Conectado via API key'
                : 'Modo demonstracao — inicie o Apex Server ou configure uma API key'}
        </p>
      </div>
    </div>
  );
}
