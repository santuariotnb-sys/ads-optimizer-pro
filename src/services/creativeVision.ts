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
  if (!duration || !isFinite(duration) || duration <= 0) {
    return [{ time: 0, label: 'hook' }];
  }

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

  // Limitar resolução para reduzir tamanho do base64
  const maxW = 800;
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 360;
  const scale = vw > maxW ? maxW / vw : 1;
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);

  // Pausar o vídeo para fazer seek sem interferência
  const wasPlaying = !video.paused;
  video.pause();

  // Timestamps estratégicos: hook (0-3s), corpo distribuído, CTA (últimos 3s)
  const timestamps = buildSmartTimestamps(duration, count);

  const frames: FrameData[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i].time;
    onProgress?.(`Extraindo frame ${i + 1}/${timestamps.length}...`);

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { video.removeEventListener('seeked', onSeeked); resolve(); }, 5000);
      function onSeeked() {
        clearTimeout(timer);
        video.removeEventListener('seeked', onSeeked);
        resolve();
      }
      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', () => { clearTimeout(timer); reject(new Error(`Erro ao buscar frame em ${formatTimestamp(ts)}`)); }, { once: true });
      video.currentTime = ts;
    });

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      frames.push({
        timestamp: formatTimestamp(ts),
        dataUrl,
        isHook: timestamps[i].label === 'hook',
        description: timestamps[i].label,
      });
    } catch (drawErr) {
      onProgress?.(`Frame ${i + 1} falhou, pulando...`);
      // Skip this frame but continue extracting others
    }
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
  onProgress?: (msg: string) => void,
): Promise<FrameData[]> {
  // Se recebeu um HTMLVideoElement (do DOM), usar diretamente
  if (fileOrVideo instanceof HTMLVideoElement) {
    const count = getFrameCount(fileOrVideo.duration || 30);
    onProgress?.(`Extraindo ${count} frames do vídeo...`);
    return extractFromDomVideo(fileOrVideo, count, onProgress);
  }

  // Verificar se o formato é suportado pelo browser
  const mimeType = fileOrVideo.type || 'video/mp4';
  const canPlay = document.createElement('video').canPlayType(mimeType);
  if (!canPlay) {
    throw new Error(
      `Formato "${mimeType}" não é suportado pelo navegador.\n` +
      'Formatos aceitos: MP4 (H.264), WebM.\n' +
      'Dica: converta o vídeo para MP4 H.264 antes de enviar.'
    );
  }

  // Se recebeu File, criar video no DOM (hidden)
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
    // Esperar metadata com timeout e error handling
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout ao carregar metadata do vídeo. Tente um formato MP4 H.264.')), 15000);
      video.addEventListener('loadedmetadata', () => { clearTimeout(timer); resolve(); }, { once: true });
      video.addEventListener('error', () => {
        clearTimeout(timer);
        const code = video.error?.code;
        const msgs: Record<number, string> = {
          1: 'Carregamento abortado',
          2: 'Erro de rede ao carregar vídeo',
          3: 'Formato não suportado pelo navegador. Use MP4 H.264.',
          4: 'Formato não suportado pelo navegador. Use MP4 H.264.',
        };
        reject(new Error(msgs[code || 0] || `Erro ao carregar vídeo (code=${code})`));
      }, { once: true });
    });
    const count = getFrameCount(video.duration || 30);
    onProgress?.(`Extraindo ${count} frames do vídeo...`);
    const frames = await extractFromDomVideo(video, count, onProgress);
    return frames;
  } finally {
    try { document.body.removeChild(video); } catch { /* already removed */ }
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
      max_tokens: 4096,
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
  return parseAIResponse(text);
}

function parseAIResponse(text: string): CreativeAnalysisResult {
  if (!text || text.trim().length === 0) {
    throw new Error('Resposta vazia da IA. Tente novamente.');
  }

  // Remove markdown code fences se existir
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Tenta extrair JSON — busca o objeto mais externo balanceado
  let depth = 0;
  let start = -1;
  let end = -1;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (cleaned[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        end = i + 1;
        break;
      }
    }
  }

  if (start === -1) {
    throw new Error('Resposta da IA não contém JSON válido. A IA pode ter retornado texto livre. Tente novamente.');
  }

  // Se JSON ficou truncado (depth > 0), tentar fechar as chaves
  if (end === -1 && depth > 0) {
    let truncated = cleaned.slice(start);
    // Remover última vírgula ou valor incompleto
    truncated = truncated.replace(/,\s*"[^"]*$/, '').replace(/,\s*$/, '');
    // Fechar arrays e objetos abertos
    for (let d = 0; d < depth; d++) truncated += d === 0 ? '}' : ']}'.slice(-1);
    try {
      return JSON.parse(truncated.replace(/,\s*([\]}])/g, '$1')) as CreativeAnalysisResult;
    } catch { /* fall through to error */ }
    throw new Error('Resposta da IA foi truncada (JSON incompleto). Tente novamente — a análise pode ter sido muito longa.');
  }

  let jsonStr = cleaned.slice(start, end);

  // Remove trailing commas antes de } ou ]
  jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

  try {
    return JSON.parse(jsonStr) as CreativeAnalysisResult;
  } catch (parseErr) {
    // Última tentativa: regex simples
    const fallback = text.match(/\{[\s\S]*\}/);
    if (fallback) {
      try {
        return JSON.parse(fallback[0].replace(/,\s*([\]}])/g, '$1')) as CreativeAnalysisResult;
      } catch { /* fall through */ }
    }
    throw new Error(`Erro ao interpretar resposta da IA: ${parseErr instanceof Error ? parseErr.message : 'JSON inválido'}. Tente novamente.`);
  }
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
      max_tokens: 4096,
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
  return parseAIResponse(text);
}
