export interface CreativeAnalysisResult {
  score: number;
  hookScore: number;
  ctaScore: number;
  hookText: string;
  ctaText: string;
  hookType: string;
  ctaType: string;
  tone: string;
  colors: string[];
  elements: string[];
  insights: { type: 'positive' | 'warning' | 'negative'; text: string }[];
  summary: string;
}

export interface FrameData {
  timestamp: string;
  dataUrl: string;
  description?: string;
  attentionScore?: number;
  isHook?: boolean;
}

// FFmpeg.wasm — carregado sob demanda
let ffmpegInstance: Awaited<ReturnType<typeof loadFFmpeg>> | null = null;

async function loadFFmpeg() {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { toBlobURL } = await import('@ffmpeg/util');
  const ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
}

async function getFFmpeg() {
  if (!ffmpegInstance) {
    ffmpegInstance = await loadFFmpeg();
  }
  return ffmpegInstance;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function formatFFmpegTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Extrai frames via FFmpeg.wasm — suporta qualquer formato
async function extractWithFFmpeg(file: File, count: number): Promise<FrameData[]> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import('@ffmpeg/util');

  const inputName = 'input' + (file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '.mp4');
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // Obter duração do vídeo
  let duration = 0;
  ffmpeg.on('log', ({ message }) => {
    const match = message.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (match) {
      duration = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
    }
  });

  // Rodar um probe rápido para pegar a duração
  await ffmpeg.exec(['-i', inputName, '-f', 'null', '-t', '0.01', '-']);

  if (duration <= 0) duration = 30; // fallback

  const frames: FrameData[] = [];

  for (let i = 0; i < count; i++) {
    const time = (duration / (count + 1)) * (i + 1);
    const outName = `frame_${i}.jpg`;

    await ffmpeg.exec([
      '-ss', formatFFmpegTime(time),
      '-i', inputName,
      '-frames:v', '1',
      '-q:v', '4',
      '-vf', 'scale=640:-1',
      '-y',
      outName,
    ]);

    const data = await ffmpeg.readFile(outName);
    const raw = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const blob = new Blob([raw as unknown as BlobPart], { type: 'image/jpeg' });
    const dataUrl = await blobToDataURL(blob);

    frames.push({
      timestamp: formatTimestamp(time),
      dataUrl,
      isHook: i === 0,
    });

    await ffmpeg.deleteFile(outName);
  }

  await ffmpeg.deleteFile(inputName);
  return frames;
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Extrai frames via Canvas (fallback simples)
async function extractWithCanvas(video: HTMLVideoElement, count: number): Promise<FrameData[]> {
  const frames: FrameData[] = [];
  const duration = video.duration;
  if (!duration || duration <= 0) return frames;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return frames;

  canvas.width = 640;
  canvas.height = 360;

  for (let i = 0; i < count; i++) {
    const time = (duration / (count + 1)) * (i + 1);
    video.currentTime = time;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push({
      timestamp: formatTimestamp(time),
      dataUrl: canvas.toDataURL('image/jpeg', 0.8),
      isHook: i === 0,
    });
  }
  return frames;
}

// Função principal: tenta FFmpeg primeiro, Canvas como fallback
export async function extractVideoFrames(
  videoOrFile: HTMLVideoElement | File,
  count = 6,
  onProgress?: (msg: string) => void,
): Promise<FrameData[]> {
  // Se recebeu File, usar FFmpeg
  if (videoOrFile instanceof File) {
    try {
      onProgress?.('Carregando FFmpeg...');
      const frames = await extractWithFFmpeg(videoOrFile, count);
      if (frames.length > 0) {
        onProgress?.(`${frames.length} frames extraídos com FFmpeg`);
        return frames;
      }
    } catch (err) {
      console.warn('FFmpeg falhou, usando Canvas como fallback:', err);
      onProgress?.('FFmpeg indisponível, usando método alternativo...');
    }
  }

  // Fallback: Canvas (precisa de HTMLVideoElement)
  if (videoOrFile instanceof HTMLVideoElement) {
    onProgress?.('Extraindo frames...');
    return extractWithCanvas(videoOrFile, count);
  }

  return [];
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

const SYSTEM_PROMPT = `Você é um especialista em análise de criativos para Meta Ads. Analise as imagens/frames enviados como se fosse um media buyer senior brasileiro avaliando o criativo.

Responda APENAS em JSON válido com esta estrutura exata:
{
  "score": <0-100>,
  "hookScore": <0-10>,
  "ctaScore": <0-10>,
  "hookText": "<texto do hook identificado>",
  "ctaText": "<texto do CTA identificado>",
  "hookType": "<Depoimento|Pergunta|Pattern Interrupt|Oferta Direta|UGC Nativo|Curiosidade>",
  "ctaType": "<Botão|Swipe|Comentário|Link Bio|Texto|Nenhum>",
  "tone": "<Inspiracional|Urgente|Casual|Energético|Educativo|Emocional>",
  "colors": ["#hex1","#hex2","#hex3","#hex4"],
  "elements": ["elemento1","elemento2","elemento3"],
  "insights": [
    {"type":"positive","text":"..."},
    {"type":"warning","text":"..."},
    {"type":"negative","text":"..."}
  ],
  "summary": "<resumo de 2-3 frases da análise>"
}

Critérios de score:
- Hook (30%): primeiros 3 segundos capturam atenção?
- Retenção prevista (25%): o conteúdo mantém interesse?
- CTA (20%): há chamada para ação clara?
- Composição (15%): qualidade visual, cores, texto legível?
- Originalidade (10%): se destaca no feed?

Sempre responda em português-BR. Sem markdown, sem explicação, APENAS o JSON.`;

export async function analyzeCreative(
  frames: FrameData[],
  apiKey: string,
  creativeType: 'video' | 'image' | 'carousel'
): Promise<CreativeAnalysisResult> {
  const content: Array<{ type: string; source?: { type: string; media_type: string; data: string }; text?: string }> = [];

  content.push({
    type: 'text',
    text: `Analise este criativo do tipo "${creativeType}". ${frames.length > 1 ? `São ${frames.length} frames extraídos do vídeo.` : 'É uma imagem estática.'}`,
  });

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

  content.push({
    type: 'text',
    text: `Analise este criativo do tipo "${creativeType}". ${frames.length > 1 ? `São ${frames.length} frames extraídos do vídeo.` : 'É uma imagem estática.'}`,
  });

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
