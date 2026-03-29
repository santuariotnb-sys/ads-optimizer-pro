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

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// Extrai frames via Canvas — único método, sem dependências externas
async function extractFramesCanvas(file: File, count: number, onProgress?: (msg: string) => void): Promise<FrameData[]> {
  return new Promise<FrameData[]>((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;

    const cleanup = () => { try { URL.revokeObjectURL(url); } catch {} };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout ao carregar vídeo (30s)'));
    }, 30000);

    video.addEventListener('error', () => {
      clearTimeout(timer);
      cleanup();
      reject(new Error(`Vídeo não suportado pelo navegador (code=${video.error?.code})`));
    }, { once: true });

    video.addEventListener('canplaythrough', async () => {
      clearTimeout(timer);
      onProgress?.('Vídeo carregado, extraindo frames...');

      const duration = video.duration;
      if (!duration || !isFinite(duration) || duration <= 0) {
        cleanup();
        reject(new Error(`Duração inválida: ${duration}`));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { cleanup(); reject(new Error('Canvas 2D indisponível')); return; }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;

      const frames: FrameData[] = [];
      for (let i = 0; i < count; i++) {
        const ts = duration * 0.05 + (duration * 0.9) * (i / Math.max(count - 1, 1));
        onProgress?.(`Extraindo frame ${i + 1}/${count}...`);

        await new Promise<void>((seekDone) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            seekDone();
          };
          video.addEventListener('seeked', onSeeked);
          video.currentTime = ts;
        });

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push({
          timestamp: formatTimestamp(ts),
          dataUrl: canvas.toDataURL('image/jpeg', 0.85),
          isHook: i === 0,
        });
      }

      cleanup();
      resolve(frames);
    }, { once: true });

    video.load();
  });
}

// Função principal de extração de frames
export async function extractVideoFrames(
  file: File,
  count = 6,
  onProgress?: (msg: string) => void,
): Promise<FrameData[]> {
  onProgress?.('Carregando vídeo...');
  return extractFramesCanvas(file, count, onProgress);
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
