export interface CreativeAnalysisResult {
  score: number;
  hookScore: number;
  ctaScore: number;
  hookText: string;
  hookVisual?: string;
  ctaText: string;
  ctaVisual?: string;
  hookType: string;
  ctaType: string;
  tone: string;
  colors: string[];
  elements: string[];
  insights: { type: 'positive' | 'warning' | 'negative'; text: string }[];
  summary: string;
  // Análise avançada de direct response
  painPoint?: string;
  promise?: string;
  mechanism?: string;
  transformation?: string;
  audienceMatch?: string;
  directResponseScore?: number;
  missingElements?: string[];
}

export interface FrameData {
  timestamp: string;
  dataUrl: string;
  description?: string;
  attentionScore?: number;
  isHook?: boolean;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// Gera timestamps estratégicos: hook (0-3s), corpo, CTA (final)
function buildSmartTimestamps(duration: number, maxFrames: number): { time: number; label: string }[] {
  const stamps: { time: number; label: string }[] = [];

  // Hook: sempre capturar 0.5s e 2.5s
  stamps.push({ time: Math.min(0.5, duration * 0.05), label: 'hook' });
  if (duration > 5) {
    stamps.push({ time: Math.min(2.5, duration * 0.3), label: 'hook' });
  }

  // CTA: últimos 3 segundos (ou último 10% para vídeos curtos)
  const ctaTime = duration > 10 ? duration - 3 : duration * 0.9;
  stamps.push({ time: ctaTime, label: 'cta' });

  // Corpo: distribuir frames restantes entre hook e CTA
  const bodyCount = maxFrames - stamps.length;
  const bodyStart = stamps[stamps.length - 2]?.time ?? 3;
  const bodyEnd = ctaTime - 1;

  if (bodyCount > 0 && bodyEnd > bodyStart) {
    for (let i = 0; i < bodyCount; i++) {
      const t = bodyStart + ((bodyEnd - bodyStart) * (i + 1)) / (bodyCount + 1);
      stamps.push({ time: t, label: 'body' });
    }
  }

  // Ordenar por tempo e limitar
  stamps.sort((a, b) => a.time - b.time);
  return stamps.slice(0, maxFrames);
}

// Extrai frames usando um <video> que já está no DOM (funciona em Safari)
async function extractFromDomVideo(
  video: HTMLVideoElement,
  count: number,
  onProgress?: (msg: string) => void,
): Promise<FrameData[]> {
  // Garantir que o vídeo tem dados suficientes
  if (video.readyState < 2) {
    onProgress?.('Aguardando vídeo carregar...');
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout ao carregar vídeo')), 30000);
      const done = () => { clearTimeout(timer); resolve(); };
      video.addEventListener('canplay', done, { once: true });
      video.addEventListener('loadeddata', done, { once: true });
      video.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error(`Erro ao carregar vídeo (code=${video.error?.code})`));
      }, { once: true });
    });
  }

  const duration = video.duration;
  if (!duration || !isFinite(duration) || duration <= 0) {
    throw new Error(`Duração inválida: ${duration}`);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível');

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 360;

  // Pausar o vídeo para fazer seek sem interferência
  const wasPlaying = !video.paused;
  video.pause();

  // Timestamps estratégicos: hook (0-3s), corpo distribuído, CTA (últimos 3s)
  const timestamps = buildSmartTimestamps(duration, count);

  const frames: FrameData[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i].time;
    onProgress?.(`Extraindo frame ${i + 1}/${timestamps.length}...`);

    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = ts;
    });

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push({
      timestamp: formatTimestamp(ts),
      dataUrl: canvas.toDataURL('image/jpeg', 0.85),
      isHook: timestamps[i].label === 'hook',
      description: timestamps[i].label,
    });
  }

  // Voltar ao início
  video.currentTime = 0;
  if (wasPlaying) video.play();

  return frames;
}

// Calcula número de frames baseado na duração: ≤30s=6, ≤60s=8, >60s=10
function getFrameCount(duration: number): number {
  if (duration <= 30) return 6;
  if (duration <= 60) return 8;
  return 10;
}

// Função principal de extração de frames
export async function extractVideoFrames(
  fileOrVideo: File | HTMLVideoElement,
  _count = 6,
  onProgress?: (msg: string) => void,
): Promise<FrameData[]> {
  // Se recebeu um HTMLVideoElement (do DOM), usar diretamente
  if (fileOrVideo instanceof HTMLVideoElement) {
    const count = getFrameCount(fileOrVideo.duration || 30);
    onProgress?.(`Extraindo ${count} frames do vídeo...`);
    return extractFromDomVideo(fileOrVideo, count, onProgress);
  }

  // Se recebeu File, criar video no DOM (hidden) para Safari
  onProgress?.('Carregando vídeo...');
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.appendChild(video);

  const url = URL.createObjectURL(fileOrVideo);
  video.src = url;
  video.load();

  try {
    // Esperar metadata para saber a duração
    await new Promise<void>((resolve) => {
      video.addEventListener('loadedmetadata', () => resolve(), { once: true });
    });
    const count = getFrameCount(video.duration || 30);
    onProgress?.(`Extraindo ${count} frames do vídeo...`);
    const frames = await extractFromDomVideo(video, count, onProgress);
    return frames;
  } finally {
    document.body.removeChild(video);
    URL.revokeObjectURL(url);
  }
}

export async function imageToFrame(file: File): Promise<FrameData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        timestamp: 'Imagem',
        dataUrl: reader.result as string,
        isHook: true,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SYSTEM_PROMPT = `Você é um media buyer senior brasileiro especialista em criativos para Meta Ads com foco em DIRECT RESPONSE (não branding). Analise os frames como se fosse avaliar se esse criativo vai CONVERTER em tráfego frio.

Os frames são extraídos estrategicamente: os primeiros são do HOOK (0-3s), os do meio são o corpo, e o último é o CTA/fechamento.

Responda APENAS em JSON válido com esta estrutura exata:
{
  "score": <0-100>,
  "hookScore": <0-10>,
  "ctaScore": <0-10>,
  "hookText": "<texto falado ou escrito no hook — transcreva literalmente. Se não houver texto, escreva 'Sem texto'>",
  "hookVisual": "<descreva o que se VÊ no hook: expressão facial, movimento, cenário, objeto em destaque, enquadramento>",
  "ctaText": "<texto EXATO do CTA. Se for apenas logo/branding sem comando de ação, diga 'Branding sem CTA direto'>",
  "ctaVisual": "<descreva: tem botão? Seta? Countdown? Urgência visual? Ou é só logo/encerramento?>",
  "hookType": "<Depoimento|Pergunta|Pattern Interrupt|Oferta Direta|UGC Nativo|Curiosidade|Storytelling|Choque|Problema/Dor>",
  "ctaType": "<Botão|Swipe|Comentário|Link Bio|Texto Direto|Oferta|Countdown|Branding|Nenhum>",
  "tone": "<Inspiracional|Urgente|Casual|Energético|Educativo|Emocional|Provocativo|Profissional|Agressivo>",
  "colors": ["#hex1","#hex2","#hex3","#hex4"],
  "elements": ["elemento1","elemento2","elemento3","elemento4","elemento5"],
  "painPoint": "<qual DOR ou PROBLEMA o criativo aborda? Se não aborda nenhuma dor clara, diga 'Não identificada'>",
  "promise": "<qual PROMESSA ou BENEFÍCIO o criativo faz? Seja específico>",
  "mechanism": "<qual MECANISMO ou MÉTODO é apresentado como solução? Ex: 'curso de 8 semanas', 'método X'>",
  "transformation": "<qual TRANSFORMAÇÃO antes/depois é mostrada ou sugerida? Se não há, diga 'Não mostrada'>",
  "audienceMatch": "<para QUEM esse criativo parece ser? Descreva o público-alvo implícito>",
  "directResponseScore": <0-10 — quão bom é como peça de DIRECT RESPONSE vs branding puro>,
  "missingElements": ["<liste elementos que FALTAM para melhorar conversão: ex: 'texto no hook', 'urgência', 'prova social', 'preço', 'garantia', 'escassez', 'depoimento', 'CTA com comando'>"],
  "insights": [
    {"type":"positive","text":"..."},
    {"type":"warning","text":"..."},
    {"type":"negative","text":"..."}
  ],
  "summary": "<resumo de 3-4 frases: diagnóstico geral + principal risco + recomendação #1>"
}

Critérios de score (foco em CONVERSÃO, não estética):
- Hook (30%): interrompe o scroll? Tem TEXTO ou NARRAÇÃO nos 3 primeiros segundos? Pattern interrupt verbal + visual?
- Persuasão (25%): apresenta dor → promessa → mecanismo → transformação? Ou fica só no conceitual?
- CTA (20%): tem COMANDO DE AÇÃO claro ("clique", "arraste", "comente")? Tem urgência/escassez? Ou é só logo?
- Prova (15%): tem depoimento, número, resultado, social proof? Ou é só afirmação sem prova?
- Originalidade (10%): se destaca no feed? Formato diferente?

IMPORTANTE: Seja HONESTO e DIRETO. Se o criativo é bonito mas fraco em direct response, diga isso. Um criativo "inspiracional bonito" com score alto mas sem dor/promessa/CTA direto é um PROBLEMA para quem quer vender.

Sempre responda em português-BR. Sem markdown, sem explicação, APENAS o JSON.`;

function buildFrameContext(frames: FrameData[], creativeType: string): string {
  const labels = frames.map((f, i) => {
    const label = f.description === 'hook' ? 'HOOK' : f.description === 'cta' ? 'CTA' : 'CORPO';
    return `Frame ${i + 1} (${f.timestamp}) — ${label}`;
  }).join(', ');
  return `Analise este criativo do tipo "${creativeType}". ${frames.length > 1 ? `São ${frames.length} frames extraídos estrategicamente: ${labels}.` : 'É uma imagem estática.'}`;
}

export async function analyzeCreative(
  frames: FrameData[],
  apiKey: string,
  creativeType: 'video' | 'image' | 'carousel'
): Promise<CreativeAnalysisResult> {
  const content: Array<{ type: string; source?: { type: string; media_type: string; data: string }; text?: string }> = [];

  content.push({ type: 'text', text: buildFrameContext(frames, creativeType) });

  for (const frame of frames) {
    const base64 = frame.dataUrl.replace(/^data:image\/\w+;base64,/, '');
    content.push({
      type: 'image' as const,
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: base64,
      },
    });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido');
  return JSON.parse(jsonMatch[0]) as CreativeAnalysisResult;
}

export async function analyzeCreativeOpenAI(
  frames: FrameData[],
  apiKey: string,
  creativeType: 'video' | 'image' | 'carousel'
): Promise<CreativeAnalysisResult> {
  const content: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = [];

  content.push({ type: 'text', text: buildFrameContext(frames, creativeType) });

  for (const frame of frames) {
    content.push({
      type: 'image_url',
      image_url: { url: frame.dataUrl, detail: 'high' },
    });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido');
  return JSON.parse(jsonMatch[0]) as CreativeAnalysisResult;
}
