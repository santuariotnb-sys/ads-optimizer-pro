import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Target, Image as ImageIcon, Play, Cpu, Radio } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickTopics = [
  { id: 'overview', label: 'Visão Geral', icon: Sparkles, question: 'Faça uma análise geral da minha conta de anúncios.' },
  { id: 'bidding', label: 'Estratégia de Lances', icon: Target, question: 'Qual a melhor estratégia de lances para minhas campanhas atuais?' },
  { id: 'creatives', label: 'Análise de Criativos', icon: ImageIcon, question: 'Analise meus criativos e identifique oportunidades.' },
  { id: 'hooks', label: 'Análise de Hooks', icon: Play, question: 'Como posso melhorar os hooks dos meus vídeos?' },
  { id: 'andromeda', label: 'Andromeda/Algoritmo', icon: Cpu, question: 'Explique como o Andromeda está afetando minhas campanhas.' },
  { id: 'signal', label: 'Signal Engineering', icon: Radio, question: 'Como posso melhorar meu Signal Engineering e EMQ?' },
];

const demoResponses: Record<string, string> = {
  overview: `**Análise Geral da Conta**

Sua conta está com Score 74/100, o que é considerado "Bom" mas com espaço significativo para melhoria.

**Pontos Positivos:**
- CPA geral de R$ 52,40 está dentro do alvo
- ROAS de 3.24x é saudável para o segmento
- Campanha [ASC] Protocolo Detox é uma estrela com ROAS 3.82x e Opportunity Score 87
- Campanha [RETARGET] Carrinho Abandonado entrega ROAS 5.21x

**Pontos de Atenção:**
- Campanha [CBO] Colágeno Premium está operando com ROAS 0.82 (negativo). Recomendo pausar imediatamente.
- Campanha [ASC] Black Friday está em Learning Limited há 18 dias com apenas 35/50 conversões. Considere consolidar ad sets.
- EMQ está em 6.8, abaixo do ideal (8.0+). Isso está aumentando seu CPA em ~11%.
- 4 criativos com mais de 10 dias ativos — novelty bias está erodindo performance.

**Ação Imediata:** Pausar Colágeno Premium, escalar Protocolo Detox +20%, e corrigir CAPI para subir EMQ.`,

  bidding: `**Estratégia de Lances Recomendada**

Analisando suas 6 campanhas, recomendo a seguinte abordagem:

**Campanhas de Performance (Detox, Skincare):**
Mantenha LOWEST_COST_WITHOUT_CAP. Com CPA de R$ 42,50 e R$ 58,30 respectivamente, o algoritmo está encontrando bons clusters. Forçar um bid cap poderia limitar o aprendizado do Andromeda.

**Retargeting (Carrinho Abandonado):**
Com ROAS 5.21x, considere mudar para COST_CAP com cap em R$ 35. Isso permitirá escalar sem perder eficiência. A frequência de 3.2 indica que o público está saturando — expanda a janela de 7d para 14d.

**Campanhas Novas (Whey):**
Em learning phase, NUNCA altere o bid strategy. O Andromeda precisa de estabilidade. Espere completar 50 conversões/semana. Com 22/50, faltam ~4 dias se manter o ritmo.

**Advantage+ Sales:**
Para suas campanhas ASC, o broad targeting é correto. O GEM está entregando +5% conversões no Instagram — garanta que seus criativos estejam otimizados para IG Reels (formato que mais performa). O investimento ideal para Advantage+ é entre R$ 500-800/dia para manter o aprendizado estável.`,

  creatives: `**Análise de Criativos + Entity IDs**

Você tem 24 criativos distribuídos em 5 Entity IDs. Isso é bom, mas há problemas:

**Entity ID #2 (Statics — Antes/Depois) — SUPERLOTADO:**
5 criativos com similaridade visual >60%. O Andromeda está usando apenas 1 ticket no leilão para todos eles. Você está pagando para produzir 5 criativos mas obtendo a chance de apenas 1.

**Winners Identificados:**
- "Reels — Trend Sound Detox" (Score 96): Hook Rate 48%, CPA R$ 32. ESCALE JÁ!
- "UGC — Influencer Detox" (Score 95): Hook Rate 45%, Hold Rate 62%. Perfeito.
- "UGC — Resultados 30 dias" (Score 93): Novíssimo (2 dias), excelente performance.

**Losers para Pausar:**
- "Carrossel — 5 Produtos Top" (Score 22): CTR 0.8%, CPA R$ 120. Pausar imediatamente.
- "Static — Comparativo Preço" (Score 18): CTR 0.7%, 13 dias ativo. Morto.

**Fadiga Detectada:**
- "Static — Antes/Depois Detox" (12 dias): CPM subiu de R$ 28 para R$ 35.20 (+25%). Substituir por novo Entity ID.

**Recomendação:** Crie 3 novos criativos em formatos diferentes (UGC testemunho, Reels trend, Motion 3D) para adicionar novos Entity IDs ao leilão.`,

  hooks: `**Análise de Hooks — O que está funcionando**

Analisei o Hook Rate (3s views / impressões) e Hold Rate (ThruPlay / 3s views) dos seus criativos:

**Top Hooks (>40% Hook Rate):**
1. "Reels — Trend Sound" (48%): Música trend + corte rápido nos primeiros 0.5s. O pattern interrupt é forte.
2. "UGC — Influencer Detox" (45%): Pessoa real falando direto com a câmera + expressão de surpresa.
3. "UGC — Resultados 30 dias" (43%): Antes/depois com transição rápida.
4. "VSL Detox — Hook Curiosidade" (42%): Pergunta provocativa nos primeiros 2s.

**Padrão dos Winners:** Todos usam os primeiros 0.5-1s para pattern interrupt (som, movimento, pergunta). O Hold Rate acima de 55% indica que o conteúdo após o hook entrega valor.

**Hooks que Falham (<25%):**
- Carrosseis têm hook rate médio de 18% — formato desfavorecido pelo algoritmo
- Statics de produto puro (sem face humana) ficam abaixo de 25%

**Recomendação para novos hooks:**
1. "Você não vai acreditar no que aconteceu..." (curiosity gap)
2. Áudio trend do momento + visual inesperado
3. Close-up em resultado real + corte para produto
4. Depoimento emocional nos primeiros 3s

Lembre-se: o Meta analisa os primeiros 3 segundos para determinar a qualidade do criativo. Um hook fraco significa CPM mais alto e alcance menor.`,

  andromeda: `**Como o Andromeda está afetando suas campanhas**

O Andromeda é o retrieval engine do Meta — ele filtra bilhões de ads para ~1.000 candidatos em <200ms usando o NVIDIA Grace Hopper Superchip + MTIA v2.

**Impacto na sua conta:**

1. **Entity ID Clustering:** Seus 24 criativos estão agrupados em 5 Entity IDs. O Entity #2 (statics) está superlotado com 5 criativos — o Andromeda vê todos como "o mesmo ad" e usa 1 ticket. Você tem efetivamente 4 chances no leilão, não 5.

2. **GEM Ranking:** Desde Q2 2025, o GEM (escala GPT-4) rankeia seus ads. Ele aprende cross-platform (IG↔FB). Seus UGCs estão performando melhor no IG (+5% conv) enquanto VSLs performam melhor no FB Feed (+3%).

3. **Broad vs Interesses:** Sua campanha Broad (Detox, Score 87) supera a de Interesses (Colágeno, Score 28) por uma margem enorme. O Andromeda é MELHOR que você em encontrar públicos — broad targeting é o caminho.

4. **Learning Phase:** A campanha Whey (8 dias, 22/50 conv) precisa de mais volume. O Andromeda calibra nos primeiros 50 conversões/semana. Abaixo disso = "foto borrada".

**Ação:** Mate a campanha de interesses (Colágeno), diversifique Entity IDs, e confie no broad targeting. O Andromeda + GEM em 2025 é absurdamente mais inteligente que segmentação manual.`,

  signal: `**Signal Engineering — Seu Maior Gargalo**

Seu EMQ está em 6.8/10. Isso significa que o Andromeda está recebendo uma "foto borrada" dos seus clientes. Você está no Nível 2 (CAPI básico) — 90% dos anunciantes estão aqui.

**Breakdown do seu EMQ:**
- Email: 2.0/2.0 ✅
- Phone: 1.5/1.5 ✅
- External ID: 1.5/1.5 ✅
- IP + User Agent: 1.0/1.0 ✅
- FBP (browser cookie): 0.5/0.5 ✅
- FBC (click ID): 0.3/0.5 ⚠️ — Você está perdendo 0.2 por não capturar todos os fbc

**Para subir para Nível 4 (EMQ 8.5+):**
Adicione estes campos no custom_data do CAPI:
- predicted_ltv: valor previsto de LTV do cliente
- margin_tier: "high", "medium", "low" baseado na margem
- engagement_score: 0-10 baseado no comportamento

**Impacto estimado:** EMQ 6.8 → 8.4 = CPA -11% (dados reais de case study). Para seu CPA de R$ 52,40, isso significaria R$ 46,64 — economia de R$ 5,76 por conversão × 878 conv/semana = R$ 5.057/semana.

**Synthetic Events (Nível 5):**
Implemente DeepEngagement (scroll 75% + 2min na LP) e HighIntentVisitor (3 visitas em 48h) via CAPI. Apenas 0.01% dos anunciantes fazem isso. Isso ensina o Andromeda comportamentos pré-compra que ele não consegue ver sozinho.`,
};

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e2e8f0;font-weight:600">$1</strong>')
    .replace(/\n/g, '<br/>');
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxHeight: 'calc(100vh - 120px)',
  background: 'rgba(12,12,20,0.6)',
  borderRadius: 16,
  border: '1px solid rgba(99,102,241,0.15)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '20px 24px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(22,22,32,0.85)',
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
  borderTop: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(22,22,32,0.9)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

const inputWrapperStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '10px 12px 10px 16px',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  transition: 'border-color 0.2s ease',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#e2e8f0',
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
  borderRadius: 20,
  border: '1px solid rgba(99,102,241,0.25)',
  background: 'rgba(99,102,241,0.08)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: '#a5b4fc',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
};

const userMessageStyle: React.CSSProperties = {
  alignSelf: 'flex-end',
  maxWidth: '75%',
  padding: '12px 16px',
  borderRadius: '16px 16px 4px 16px',
  background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
  color: '#fff',
  fontSize: 14,
  lineHeight: 1.6,
  boxShadow: '0 2px 16px rgba(99,102,241,0.25)',
};

const assistantMessageStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  maxWidth: '85%',
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
};

const assistantBubbleStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderRadius: '16px 16px 16px 4px',
  background: 'rgba(22,22,32,0.85)',
  border: '1px solid rgba(255,255,255,0.06)',
  color: '#cbd5e1',
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
  background: 'rgba(22,22,32,0.85)',
  border: '1px solid rgba(255,255,255,0.06)',
};

const typingKeyframes = `
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}
`;

export default function Agent() {
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `**Olá! Sou seu Consultor de Ads com IA.** 👋

Posso analisar suas campanhas, criativos, estratégias de lances e muito mais. Tenho acesso aos dados da sua conta e conheço profundamente o algoritmo do Meta (Andromeda + GEM).

Escolha um dos tópicos abaixo ou digite sua pergunta:`,
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

  const handleTopicClick = (topicId: string, question: string) => {
    const userMsg: Message = {
      id: `user-${++msgIdRef.current}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    addAssistantMessage(demoResponses[topicId] || 'Desculpe, não tenho uma resposta para isso ainda.');
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

    const matchedTopic = quickTopics.find(
      (t) =>
        trimmed.toLowerCase().includes(t.label.toLowerCase()) ||
        trimmed.toLowerCase().includes(t.id.toLowerCase())
    );
    if (matchedTopic) {
      addAssistantMessage(demoResponses[matchedTopic.id]);
    } else {
      addAssistantMessage(
        `**Análise Personalizada**\n\nBaseado na sua pergunta, identifiquei os seguintes pontos relevantes:\n\n- Seu CPA médio de R$ 52,40 pode ser otimizado em até 15% com ajustes no Signal Engineering (EMQ atual: 6.8)\n- Recomendo focar em criativos UGC que apresentam Hook Rate 45%+ versus statics com apenas 18%\n- O Andromeda favorece broad targeting — campanhas sem segmentação manual estão performando 3.2x melhor\n\nPara uma análise mais detalhada, selecione um dos tópicos disponíveis acima.`
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
                color: '#e2e8f0',
                letterSpacing: '-0.01em',
              }}
            >
              Consultor de Ads IA
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              Análise inteligente das suas campanhas Meta Ads
            </p>
          </div>
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
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#4ade80',
                boxShadow: '0 0 8px rgba(74,222,128,0.5)',
              }}
            />
            <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 500 }}>Online</span>
          </div>
        </div>

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
            <div key={msg.id} style={{ ...userMessageStyle, maxWidth: isMobile ? '90%' : '75%' }}>
              <span>{msg.content}</span>
            </div>
          ) : (
            <div key={msg.id} style={{ ...assistantMessageStyle, maxWidth: isMobile ? '90%' : '85%' }}>
              <div style={botAvatarStyle}>
                <Bot size={16} color="#fff" />
              </div>
              <div
                style={assistantBubbleStyle}
                dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
              />
            </div>
          )
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div style={assistantMessageStyle} aria-live="polite">
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
              : 'rgba(255,255,255,0.08)',
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
        </div>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 11,
            color: '#475569',
            textAlign: 'center',
          }}
        >
          Modo demonstração — respostas pré-configuradas com dados simulados
        </p>
      </div>
    </div>
  );
}
