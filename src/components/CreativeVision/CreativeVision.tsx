import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  Upload, Eye, Sparkles, Film, Image as ImageIcon, Palette,
  Target, Zap, CheckCircle, AlertTriangle, XCircle, Loader, MessageSquare, Download, Clock,
} from 'lucide-react';
import AlpineCard from '../Layout/AlpineCard';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useStore } from '../../store/useStore';
import {
  analyzeCreative, analyzeCreativeOpenAI,
  extractVideoFrames, imageToFrame,
  type CreativeAnalysisResult, type FrameData,
} from '../../services/creativeVision';

type Provider = 'claude' | 'openai';
type CreativeType = 'video' | 'image' | 'carousel';

// SECURITY NOTE: These session keys store the USER's own API key (provided by them
// in the UI input field) so it persists across page refreshes within the same tab.
// This is intentional — we do NOT own or supply this key. The key is never logged,
// never sent to our servers, and is cleared when the browser tab closes.
const SESSION_KEY_KEY = 'ads_everest_vision_key';
const SESSION_PROVIDER_KEY = 'ads_everest_vision_provider';

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: '.18em',
  textTransform: 'uppercase', color: '#64748b', margin: 0,
};

const insightIcon = {
  positive: <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} />,
  warning: <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />,
  negative: <XCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />,
};

export default function CreativeVision() {
  const isMobile = useIsMobile();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [provider, setProvider] = useState<Provider>(() =>
    (sessionStorage.getItem(SESSION_PROVIDER_KEY) as Provider) || 'claude'
  );
  const [apiKey, setApiKey] = useState(() =>
    sessionStorage.getItem(SESSION_KEY_KEY) || import.meta.env.VITE_ANTHROPIC_API_KEY || ''
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [creativeType, setCreativeType] = useState<CreativeType>('image');
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [result, setResult] = useState<CreativeAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<CreativeAnalysisResult | null>(null);
  const [compareB, setCompareB] = useState<CreativeAnalysisResult | null>(null);
  const [compareNameA, setCompareNameA] = useState('');
  const [compareNameB, setCompareNameB] = useState('');
  const setCreativeAnalysisContext = useStore((s) => s.setCreativeAnalysisContext);
  const setCurrentModule = useStore((s) => s.setCurrentModule);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY_KEY, apiKey);
    sessionStorage.setItem(SESSION_PROVIDER_KEY, provider);
  }, [apiKey, provider]);

  // Histórico de análises (localStorage)
  interface HistoryEntry { id: string; fileName: string; score: number; hookScore: number; ctaScore: number; drScore?: number; date: string; result: CreativeAnalysisResult; }
  const HISTORY_KEY = 'ads_everest_analysis_history';

  const getHistory = useCallback((): HistoryEntry[] => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  }, []);

  const saveToHistory = useCallback((fileName: string, analysisResult: CreativeAnalysisResult) => {
    const history = getHistory();
    const entry: HistoryEntry = {
      id: `${Date.now()}`,
      fileName,
      score: analysisResult.score,
      hookScore: analysisResult.hookScore,
      ctaScore: analysisResult.ctaScore,
      drScore: analysisResult.directResponseScore,
      date: new Date().toLocaleString('pt-BR'),
      result: analysisResult,
    };
    const updated = [entry, ...history].slice(0, 20); // max 20 entries
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }, [getHistory]);

  const loadFromHistory = useCallback((entry: HistoryEntry) => {
    setResult(entry.result);
    setFrames([]);
    setShowHistory(false);
    setError(null);
    setActionPlan(null);
  }, []);

  const handleFile = useCallback((f: File) => {
    if (f.size > 500 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 500MB.');
      return;
    }
    setFile(f);
    setResult(null);
    setFrames([]);
    setError(null);
    setPreview(URL.createObjectURL(f));
    if (f.type.startsWith('video/')) setCreativeType('video');
    else setCreativeType('image');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const [progress, setProgress] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleAnalyze = async () => {
    if (!file || !apiKey) return;
    setShowConfirmModal(false);
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      let extractedFrames: FrameData[];

      if (creativeType === 'video') {
        const source = videoRef.current && videoRef.current.readyState >= 1 ? videoRef.current : file;
        try {
          extractedFrames = await extractVideoFrames(source, setProgress);
        } catch (extractErr) {
          throw new Error(extractErr instanceof Error ? extractErr.message : 'Erro ao extrair frames');
        }
        if (extractedFrames.length === 0) {
          throw new Error('Não foi possível extrair frames do vídeo. Tente outro formato (MP4 H.264).');
        }
      } else {
        setProgress('Processando imagem...');
        const frame = await imageToFrame(file);
        extractedFrames = [frame];
      }

      setFrames(extractedFrames);
      setProgress(`Enviando ${extractedFrames.length} frames para ${provider}...`);

      let analysisResult: Awaited<ReturnType<typeof analyzeCreative>>;
      try {
        analysisResult = provider === 'claude'
          ? await analyzeCreative(extractedFrames, apiKey, creativeType)
          : await analyzeCreativeOpenAI(extractedFrames, apiKey, creativeType);
      } catch (apiErr) {
        throw new Error(apiErr instanceof Error ? apiErr.message : 'Erro ao conectar com a IA');
      }

      setResult(analysisResult);
      saveToHistory(file?.name || 'criativo', analysisResult);
      setProgress(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido na análise';
      setError(msg);
      setProgress(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateSolutions = async () => {
    if (!result || !apiKey) return;
    setGeneratingPlan(true);
    setActionPlan(null);

    const prompt = `Baseado nesta análise de criativo para Meta Ads, gere um plano de ação concreto com melhorias específicas.

Análise:
${JSON.stringify(result, null, 2)}

Gere melhorias para:
1. Hook — texto, timing, formato (score atual: ${result.hookScore}/10)
2. CTA — posicionamento, texto, urgência (score atual: ${result.ctaScore}/10)
3. Cores e paleta visual
4. Elementos visuais e composição
5. Timing e ritmo (se vídeo)

Formato: lista numerada com ações práticas e diretas. Sempre em português-BR.`;

    try {
      let text: string;
      if (provider === 'claude') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        text = data.content?.[0]?.text || '';
      } else {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'gpt-4o', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        text = data.choices?.[0]?.message?.content || '';
      }
      setActionPlan(text);
    } catch (err) {
      setActionPlan(`Erro ao gerar soluções: ${err instanceof Error ? err.message : err}`);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleDiscussWithAgent = () => {
    if (!result) return;
    setCreativeAnalysisContext(result);
    setCurrentModule('opt-agent');
  };

  const handleExport = () => {
    if (!result) return;
    const now = new Date().toLocaleString('pt-BR');
    const scoreColor = result.score >= 70 ? '#10b981' : result.score >= 40 ? '#f59e0b' : '#ef4444';
    const drColor = (result.directResponseScore ?? 0) >= 7 ? '#10b981' : (result.directResponseScore ?? 0) >= 4 ? '#f59e0b' : '#ef4444';

    const framesHtml = frames.map((f) => {
      const label = f.description === 'hook' ? 'HOOK' : f.description === 'cta' ? 'CTA' : '';
      const borderColor = f.description === 'hook' ? '#6366f1' : f.description === 'cta' ? '#f59e0b' : '#e2e8f0';
      return `<div style="display:inline-block;margin:0 8px 8px 0;text-align:center;border:2px solid ${borderColor};border-radius:10px;overflow:hidden;vertical-align:top">
        <img src="${f.dataUrl}" width="200" style="display:block" />
        <div style="padding:4px 8px;font-size:12px;background:#f8fafc">
          <b>${f.timestamp}</b>${label ? ` <span style="color:${borderColor};font-weight:700">${label}</span>` : ''}
        </div>
      </div>`;
    }).join('');

    const insightsHtml = result.insights.map(i => {
      const c = i.type === 'positive' ? '#10b981' : i.type === 'warning' ? '#f59e0b' : '#ef4444';
      const icon = i.type === 'positive' ? '\u2714' : i.type === 'warning' ? '\u26A0' : '\u2716';
      return `<div style="padding:8px 12px;margin:4px 0;border-radius:8px;background:${c}0a;border:1px solid ${c}20"><span style="color:${c}">${icon}</span> ${i.text}</div>`;
    }).join('');

    const missingHtml = result.missingElements?.length
      ? result.missingElements.map(el => `<span style="display:inline-block;padding:3px 10px;margin:2px;border-radius:6px;background:#fef2f2;border:1px solid #fecaca;color:#dc2626;font-size:12px">${el}</span>`).join('')
      : '';

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Analise Criativo - ${file?.name || 'export'}</title>
<style>body{font-family:'Segoe UI',system-ui,sans-serif;max-width:900px;margin:0 auto;padding:32px;color:#1e293b;background:#fff}
h1{font-size:22px;border-bottom:2px solid #6366f1;padding-bottom:8px}h2{font-size:16px;color:#6366f1;margin:24px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.card{padding:12px;border-radius:10px;border:1px solid #e2e8f0}
.score{font-size:48px;font-weight:800;text-align:center}.meta{font-size:13px;color:#64748b}
.colors{display:flex;gap:6px}.color{width:28px;height:28px;border-radius:6px;border:1px solid #e2e8f0}</style></head>
<body>
<h1>Relatorio de Analise de Criativo</h1>
<p class="meta">Gerado em: ${now} | Arquivo: ${file?.name || '\u2014'} | Tipo: ${creativeType} | Provider: ${provider === 'claude' ? 'Claude (Anthropic)' : 'GPT-4o (OpenAI)'}</p>

<div class="grid">
<div class="card" style="text-align:center">
<h2 style="border:none;margin:0 0 8px">Score Geral</h2>
<div class="score" style="color:${scoreColor}">${result.score}<span style="font-size:18px;color:#94a3b8">/100</span></div>
<p style="margin:4px 0"><b>Tom:</b> ${result.tone}</p>
<div class="colors" style="justify-content:center;margin-top:8px">${result.colors.map(c => `<div class="color" style="background:${c}" title="${c}"></div>`).join('')}</div>
</div>
<div>
<div class="card" style="margin-bottom:10px;border-color:#6366f130">
<div style="display:flex;justify-content:space-between"><b style="color:#6366f1">Hook: ${result.hookType}</b><span style="font-weight:800;color:#6366f1">${result.hookScore}/10</span></div>
<p style="font-style:italic;margin:4px 0">"${result.hookText}"</p>
${result.hookVisual ? `<p class="meta">${result.hookVisual}</p>` : ''}
</div>
<div class="card" style="border-color:#f59e0b30">
<div style="display:flex;justify-content:space-between"><b style="color:#f59e0b">CTA: ${result.ctaType}</b><span style="font-weight:800;color:#f59e0b">${result.ctaScore}/10</span></div>
<p style="margin:4px 0">"${result.ctaText}"</p>
${result.ctaVisual ? `<p class="meta">${result.ctaVisual}</p>` : ''}
</div>
</div>
</div>

<h2>Elementos</h2>
<p>${result.elements.map(e => `<span style="display:inline-block;padding:3px 10px;margin:2px;border-radius:6px;background:#f1f5f9;font-size:12px">${e}</span>`).join('')}</p>

<h2>Analise Direct Response ${result.directResponseScore !== undefined ? `<span style="float:right;color:${drColor};font-weight:800">${result.directResponseScore}/10</span>` : ''}</h2>
<div class="grid">
${[
  { l: 'Dor/Problema', v: result.painPoint, c: '#ef4444' },
  { l: 'Promessa', v: result.promise, c: '#10b981' },
  { l: 'Mecanismo', v: result.mechanism, c: '#6366f1' },
  { l: 'Transformacao', v: result.transformation, c: '#f59e0b' },
  { l: 'Publico-alvo', v: result.audienceMatch, c: '#8b5cf6' },
].filter(x => x.v).map(x => `<div class="card" style="border-color:${x.c}20"><b style="color:${x.c};font-size:11px;text-transform:uppercase">${x.l}</b><p style="margin:4px 0;font-size:13px">${x.v}</p></div>`).join('')}
</div>
${missingHtml ? `<div class="card" style="margin-top:10px;border-color:#fecaca"><b style="color:#dc2626;font-size:11px;text-transform:uppercase">Elementos Faltando</b><div style="margin-top:6px">${missingHtml}</div></div>` : ''}

<h2>Frames Extraidos</h2>
<div>${framesHtml}</div>

<h2>Insights da IA</h2>
${insightsHtml}

<h2>Resumo</h2>
<p style="font-style:italic;line-height:1.7;background:#f8fafc;padding:16px;border-radius:10px">"${result.summary}"</p>

${actionPlan ? `<h2>Plano de Acao</h2><pre style="white-space:pre-wrap;background:#f8fafc;padding:16px;border-radius:10px;font-size:13px;line-height:1.6">${actionPlan}</pre>` : ''}

<p class="meta" style="margin-top:32px;text-align:center">Gerado por Ads.Everest - Analise de Criativos com IA</p>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analise-criativo-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasKey = apiKey.length > 10;
  const canAnalyze = file && hasKey && !analyzing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Eye size={22} style={{ color: '#6366f1' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
              Análise de Criativos com IA
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Envie uma imagem ou vídeo para análise visual automática
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            border: '1px solid rgba(15,23,42,0.1)',
            background: showHistory ? 'rgba(99,102,241,0.06)' : 'transparent',
            color: showHistory ? '#6366f1' : '#64748b',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <Clock size={14} />
          Histórico
        </button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <AlpineCard padding={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ ...labelStyle, margin: 0 }}>Análises Anteriores</p>
            {getHistory().length >= 2 && (
              <button
                onClick={() => { setCompareMode(!compareMode); setCompareA(null); setCompareB(null); }}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: compareMode ? '#6366f1' : 'rgba(99,102,241,0.08)',
                  color: compareMode ? '#fff' : '#6366f1',
                }}
              >
                {compareMode ? 'Cancelar' : 'Comparar'}
              </button>
            )}
          </div>
          {getHistory().length === 0 ? (
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Nenhuma análise salva ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
              {getHistory().map((entry) => {
                const scoreColor = entry.score >= 70 ? '#10b981' : entry.score >= 40 ? '#f59e0b' : '#ef4444';
                const isSelectedA = compareA && compareNameA === entry.fileName && compareA.score === entry.score;
                const isSelectedB = compareB && compareNameB === entry.fileName && compareB.score === entry.score;
                return (
                  <div
                    key={entry.id}
                    onClick={() => {
                      if (compareMode) {
                        if (!compareA) { setCompareA(entry.result); setCompareNameA(entry.fileName); }
                        else if (!compareB) { setCompareB(entry.result); setCompareNameB(entry.fileName); }
                      } else {
                        loadFromHistory(entry);
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      border: isSelectedA ? '2px solid #6366f1' : isSelectedB ? '2px solid #f59e0b' : '1px solid rgba(15,23,42,0.06)',
                      background: isSelectedA ? 'rgba(99,102,241,0.06)' : isSelectedB ? 'rgba(245,158,11,0.06)' : 'rgba(15,23,42,0.02)',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => { if (!isSelectedA && !isSelectedB) e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                    onMouseLeave={e => { if (!isSelectedA && !isSelectedB) e.currentTarget.style.background = 'rgba(15,23,42,0.02)'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.fileName}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{entry.date}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      {compareMode && (isSelectedA ? <span style={{ fontSize: 10, fontWeight: 700, color: '#6366f1' }}>A</span> : isSelectedB ? <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>B</span> : null)}
                      <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor, fontFamily: "'JetBrains Mono', monospace" }}>{entry.score}</span>
                      {entry.drScore !== undefined && (
                        <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>DR:{entry.drScore}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AlpineCard>
      )}

      {/* Comparison View */}
      {compareA && compareB && (
        <AlpineCard padding={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ ...labelStyle, margin: 0 }}>Comparação de Criativos</p>
            <button onClick={() => { setCompareA(null); setCompareB(null); setCompareMode(false); }} style={{ fontSize: 11, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Fechar</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 0 }}>
            {/* Header */}
            <div style={{ textAlign: 'center', padding: '8px', fontWeight: 600, fontSize: 12, color: '#6366f1' }}>{compareNameA}</div>
            <div style={{ textAlign: 'center', padding: '8px', fontWeight: 600, fontSize: 10, color: '#94a3b8' }}>VS</div>
            <div style={{ textAlign: 'center', padding: '8px', fontWeight: 600, fontSize: 12, color: '#f59e0b' }}>{compareNameB}</div>
            {/* Metrics rows */}
            {[
              { label: 'Score', a: compareA.score, b: compareB.score, suffix: '/100' },
              { label: 'Hook', a: compareA.hookScore, b: compareB.hookScore, suffix: '/10' },
              { label: 'CTA', a: compareA.ctaScore, b: compareB.ctaScore, suffix: '/10' },
              { label: 'DR Score', a: compareA.directResponseScore ?? 0, b: compareB.directResponseScore ?? 0, suffix: '/10' },
            ].map((row) => {
              const aWins = row.a > row.b;
              const bWins = row.b > row.a;
              return [
                <div key={`${row.label}-a`} style={{ textAlign: 'center', padding: '6px 8px', fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: aWins ? '#10b981' : '#334155' }}>
                  {row.a}<span style={{ fontSize: 10, color: '#94a3b8' }}>{row.suffix}</span>
                  {aWins && <span style={{ fontSize: 10, color: '#10b981', marginLeft: 4 }}>▲</span>}
                </div>,
                <div key={`${row.label}-l`} style={{ textAlign: 'center', padding: '6px 8px', fontSize: 10, color: '#94a3b8', alignSelf: 'center' }}>{row.label}</div>,
                <div key={`${row.label}-b`} style={{ textAlign: 'center', padding: '6px 8px', fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: bWins ? '#10b981' : '#334155' }}>
                  {row.b}<span style={{ fontSize: 10, color: '#94a3b8' }}>{row.suffix}</span>
                  {bWins && <span style={{ fontSize: 10, color: '#10b981', marginLeft: 4 }}>▲</span>}
                </div>,
              ];
            })}
            {/* Tone */}
            <div style={{ textAlign: 'center', padding: '6px 8px', fontSize: 12, color: '#334155' }}>{compareA.tone}</div>
            <div style={{ textAlign: 'center', padding: '6px 8px', fontSize: 10, color: '#94a3b8', alignSelf: 'center' }}>Tom</div>
            <div style={{ textAlign: 'center', padding: '6px 8px', fontSize: 12, color: '#334155' }}>{compareB.tone}</div>
            {/* Hook Type */}
            <div style={{ textAlign: 'center', padding: '6px 8px', fontSize: 12, color: '#6366f1' }}>{compareA.hookType}</div>
            <div style={{ textAlign: 'center', padding: '6px 8px', fontSize: 10, color: '#94a3b8', alignSelf: 'center' }}>Hook</div>
            <div style={{ textAlign: 'center', padding: '6px 8px', fontSize: 12, color: '#f59e0b' }}>{compareB.hookType}</div>
          </div>
        </AlpineCard>
      )}

      {/* API Config */}
      <AlpineCard padding={20}>
        <p style={{ ...labelStyle, marginBottom: 12 }}>Configuração da API</p>
        <div style={{ display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['claude', 'openai'] as Provider[]).map(p => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: provider === p ? 'rgba(15,23,42,0.06)' : 'transparent',
                  color: provider === p ? '#0f172a' : '#64748b',
                  fontWeight: provider === p ? 600 : 500, fontSize: 13,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: 'all .2s',
                }}
              >
                {p === 'claude' ? 'Claude (Anthropic)' : 'GPT-4o (OpenAI)'}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={`API Key ${provider === 'claude' ? 'Anthropic' : 'OpenAI'}`}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: '1px solid rgba(15,23,42,0.1)', background: 'rgba(15,23,42,0.03)',
                color: '#0f172a', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif",
                outline: 'none',
              }}
            />
            <span style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: hasKey ? '#10b981' : '#94a3b8',
              boxShadow: hasKey ? '0 0 8px rgba(16,185,129,0.4)' : 'none',
            }} />
            <span style={{ fontSize: 11, color: hasKey ? '#10b981' : '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {hasKey ? 'Configurado' : 'Não configurado'}
            </span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#64748b', marginTop: 10, marginBottom: 0 }}>
          Analise visual requer API key (Claude ou OpenAI). O Agent Bridge nao suporta envio de imagens.
        </p>
      </AlpineCard>

      {/* Upload Area */}
      <AlpineCard padding={0} tilt={false}>
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            padding: preview ? 0 : 48,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', minHeight: preview ? 'auto' : 200,
            borderRadius: 28, overflow: 'hidden',
            border: dragOver ? '2px dashed #6366f1' : '2px dashed transparent',
            background: dragOver ? 'rgba(99,102,241,0.04)' : 'transparent',
            transition: 'all .2s',
          }}
        >
          {preview ? (
            creativeType === 'video' ? (
              <video
                ref={videoRef}
                src={preview}
                controls
                preload="auto"
                style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 28 }}
              />
            ) : (
              <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 28 }} />
            )
          ) : (
            <>
              <Upload size={32} style={{ color: '#94a3b8', marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, margin: 0 }}>
                Arraste ou clique para enviar
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>
                MP4, MOV, JPG, PNG, WebP — Máx 500MB
              </p>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          style={{ display: 'none' }}
        />
      </AlpineCard>

      {/* Type selector + Analyze button */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {([
            { id: 'video' as CreativeType, label: 'Vídeo', icon: Film },
            { id: 'image' as CreativeType, label: 'Imagem', icon: ImageIcon },
            { id: 'carousel' as CreativeType, label: 'Carousel', icon: Palette },
          ]).map(t => {
            const Icon = t.icon;
            const active = creativeType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setCreativeType(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(15,23,42,0.06)' : 'transparent',
                  color: active ? '#0f172a' : '#64748b',
                  fontWeight: active ? 600 : 500, fontSize: 13,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => analyzing ? undefined : setShowConfirmModal(true)}
          disabled={!canAnalyze}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 28px', borderRadius: 14, border: 'none', cursor: canAnalyze ? 'pointer' : 'not-allowed',
            background: canAnalyze ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(15,23,42,0.08)',
            color: canAnalyze ? '#fff' : '#94a3b8',
            fontSize: 14, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif",
            opacity: analyzing ? 0.7 : 1, transition: 'all .2s',
            marginLeft: isMobile ? 0 : 'auto',
          }}
        >
          {analyzing ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
          {analyzing ? (progress || 'Analisando...') : 'Analisar Criativo'}
        </button>
      </div>

      {/* Modal de confirmação */}
      {showConfirmModal && createPortal(
        <div
          onClick={() => setShowConfirmModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20, padding: 28,
              maxWidth: 380, width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={18} color="#fff" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Confirmar Análise
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                <span>Arquivo</span>
                <span style={{ color: '#0f172a', fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file?.name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                <span>Tipo</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>
                  {creativeType === 'video' ? 'Vídeo' : creativeType === 'image' ? 'Imagem' : 'Carousel'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                <span>IA</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>
                  {provider === 'claude' ? 'Claude (Anthropic)' : 'GPT-4o (OpenAI)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                <span>Tamanho</span>
                <span style={{ color: '#0f172a', fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>
                  {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : '—'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(15,23,42,0.1)',
                  background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAnalyze}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Analisar
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
          color: '#ef4444', fontSize: 13, fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* Score + Tone + Colors */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: 16 }}>
            <AlpineCard padding={24}>
              <p style={{ ...labelStyle, marginBottom: 16 }}>Score do Criativo</p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', width: 120, height: 120 }}>
                  <svg viewBox="0 0 100 100" width={120} height={120}>
                    <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth={7} />
                    <motion.circle
                      cx={50} cy={50} r={40} fill="none"
                      stroke={result.score >= 70 ? '#10b981' : result.score >= 40 ? '#f59e0b' : '#ef4444'}
                      strokeWidth={7} strokeLinecap="round"
                      strokeDasharray={251.3}
                      initial={{ strokeDashoffset: 251.3 }}
                      animate={{ strokeDashoffset: 251.3 - (result.score / 100) * 251.3 }}
                      transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                      transform="rotate(-90 50 50)"
                    />
                    <text x={50} y={46} textAnchor="middle" fontSize={28} fontWeight={700} fill="#0f172a" fontFamily="Space Grotesk">
                      {result.score}
                    </text>
                    <text x={50} y={62} textAnchor="middle" fontSize={9} fill="#64748b" fontFamily="Plus Jakarta Sans">
                      /100
                    </text>
                  </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Tom</span>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '2px 0 0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{result.tone}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {result.colors.map((c, i) => (
                    <div key={i} title={c} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: '1px solid rgba(15,23,42,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                  ))}
                </div>
              </div>
            </AlpineCard>

            {/* Hook + CTA Analysis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Hook */}
              <AlpineCard padding={20}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={14} style={{ color: '#6366f1' }} />
                    </div>
                    <div>
                      <p style={{ ...labelStyle, margin: 0 }}>Hook</p>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1' }}>{result.hookType}</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 10, padding: '6px 12px' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#6366f1', fontFamily: "'JetBrains Mono', monospace" }}>{result.hookScore}<span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>/10</span></span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#334155', fontStyle: 'italic', margin: '0 0 6px', lineHeight: 1.5 }}>"{result.hookText}"</p>
                {result.hookVisual && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.06)' }}>
                    <Eye size={12} style={{ color: '#94a3b8', marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{result.hookVisual}</p>
                  </div>
                )}
              </AlpineCard>

              {/* CTA */}
              <AlpineCard padding={20}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Target size={14} style={{ color: '#f59e0b' }} />
                    </div>
                    <div>
                      <p style={{ ...labelStyle, margin: 0 }}>CTA</p>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>{result.ctaType}</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: '6px 12px' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace" }}>{result.ctaScore}<span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>/10</span></span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#334155', margin: '0 0 6px', lineHeight: 1.5 }}>"{result.ctaText}"</p>
                {result.ctaVisual && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.06)' }}>
                    <Eye size={12} style={{ color: '#94a3b8', marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{result.ctaVisual}</p>
                  </div>
                )}
              </AlpineCard>
            </div>
          </div>

          {/* Elements */}
          <AlpineCard padding={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <p style={{ ...labelStyle, margin: 0 }}>Elementos Identificados</p>
              <span style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(15,23,42,0.04)', borderRadius: 6, padding: '2px 8px' }}>{result.elements.length}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {result.elements.map((e, i) => (
                <span key={i} style={{
                  fontSize: 12, padding: '5px 12px', borderRadius: 10,
                  background: 'rgba(15,23,42,0.03)', border: '1px solid rgba(15,23,42,0.08)',
                  color: '#334155', fontWeight: 500,
                }}>{e}</span>
              ))}
            </div>
          </AlpineCard>

          {/* Frames Timeline */}
          {frames.length > 1 && (
            <AlpineCard padding={20}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <p style={{ ...labelStyle, margin: 0 }}>Frames Extraídos</p>
                <span style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(15,23,42,0.04)', borderRadius: 6, padding: '2px 8px' }}>{frames.length} frames</span>
              </div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                {frames.map((f, i) => {
                  const label = f.description === 'hook' ? 'HOOK' : f.description === 'cta' ? 'CTA' : null;
                  const labelColor = f.description === 'hook' ? '#6366f1' : f.description === 'cta' ? '#f59e0b' : '#94a3b8';
                  return (
                    <div key={i} style={{ minWidth: 150, flexShrink: 0, borderRadius: 12, overflow: 'hidden', border: label ? `1px solid ${labelColor}30` : '1px solid rgba(15,23,42,0.08)', background: label ? `${labelColor}04` : 'transparent' }}>
                      <img src={f.dataUrl} alt={f.timestamp} style={{ width: 150, height: 85, objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{f.timestamp}</span>
                        {label && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: labelColor, background: `${labelColor}12`, padding: '2px 8px', borderRadius: 6, letterSpacing: '.05em' }}>{label}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AlpineCard>
          )}

          {/* Insights */}
          <AlpineCard padding={20}>
            <p style={{ ...labelStyle, marginBottom: 14 }}>Insights da IA</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {result.insights.map((ins, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: ins.type === 'positive' ? 'rgba(16,185,129,0.04)' : ins.type === 'warning' ? 'rgba(245,158,11,0.04)' : 'rgba(239,68,68,0.04)', border: `1px solid ${ins.type === 'positive' ? 'rgba(16,185,129,0.1)' : ins.type === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
                  {insightIcon[ins.type]}
                  <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </AlpineCard>

          {/* Direct Response Analysis */}
          {(result.painPoint || result.directResponseScore !== undefined) && (
            <AlpineCard padding={20}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ ...labelStyle, margin: 0 }}>Análise Direct Response</p>
                {result.directResponseScore !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>DR SCORE</span>
                    <span style={{
                      fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                      color: result.directResponseScore >= 7 ? '#10b981' : result.directResponseScore >= 4 ? '#f59e0b' : '#ef4444',
                      background: result.directResponseScore >= 7 ? 'rgba(16,185,129,0.08)' : result.directResponseScore >= 4 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                      borderRadius: 8, padding: '4px 10px',
                    }}>{result.directResponseScore}/10</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Dor / Problema', value: result.painPoint, color: '#ef4444' },
                  { label: 'Promessa', value: result.promise, color: '#10b981' },
                  { label: 'Mecanismo', value: result.mechanism, color: '#6366f1' },
                  { label: 'Transformação', value: result.transformation, color: '#f59e0b' },
                  { label: 'Público-alvo', value: result.audienceMatch, color: '#8b5cf6' },
                ].filter(item => item.value).map((item, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: `${item.color}06`, border: `1px solid ${item.color}15` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: item.color, textTransform: 'uppercase', letterSpacing: '.08em' }}>{item.label}</span>
                    <p style={{ fontSize: 12, color: '#334155', margin: '4px 0 0', lineHeight: 1.5 }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Missing Elements */}
              {result.missingElements && result.missingElements.length > 0 && (
                <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '.08em' }}>Elementos Faltando</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {result.missingElements.map((el, i) => (
                      <span key={i} style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 8,
                        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
                        color: '#dc2626', fontWeight: 500,
                      }}>{el}</span>
                    ))}
                  </div>
                </div>
              )}
            </AlpineCard>
          )}

          {/* Summary */}
          <AlpineCard padding={20}>
            <p style={{ ...labelStyle, marginBottom: 10 }}>Resumo da Análise</p>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
              "{result.summary}"
            </p>
          </AlpineCard>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerateSolutions}
              disabled={generatingPlan}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 14, border: 'none',
                background: generatingPlan ? 'rgba(15,23,42,0.08)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: generatingPlan ? '#94a3b8' : '#fff',
                fontSize: 14, fontWeight: 600, cursor: generatingPlan ? 'wait' : 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'all .2s',
              }}
            >
              {generatingPlan ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
              {generatingPlan ? 'Gerando soluções...' : 'Gerar Soluções'}
            </button>
            <button
              onClick={handleDiscussWithAgent}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 14,
                border: '1px solid rgba(99,102,241,0.3)',
                background: 'rgba(99,102,241,0.06)',
                color: '#6366f1',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'all .2s',
              }}
            >
              <MessageSquare size={16} />
              Discutir com Agente IA
            </button>
            <button
              onClick={handleExport}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 14,
                border: '1px solid rgba(15,23,42,0.12)',
                background: 'rgba(15,23,42,0.03)',
                color: '#64748b',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'all .2s',
              }}
            >
              <Download size={16} />
              Exportar
            </button>
          </div>

          {/* Action Plan */}
          {actionPlan && (
            <AlpineCard padding={20}>
              <p style={{ ...labelStyle, marginBottom: 10 }}>Plano de Ação</p>
              <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {actionPlan}
              </div>
            </AlpineCard>
          )}
        </motion.div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </motion.div>
  );
}
