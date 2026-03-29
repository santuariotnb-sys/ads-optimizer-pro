import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Upload, Eye, Sparkles, Film, Image as ImageIcon, Palette,
  Target, Zap, CheckCircle, AlertTriangle, XCircle, Loader,
} from 'lucide-react';
import AlpineCard from '../Layout/AlpineCard';
import { useIsMobile } from '../../hooks/useMediaQuery';
import {
  analyzeCreative, analyzeCreativeOpenAI,
  extractVideoFrames, imageToFrame,
  type CreativeAnalysisResult, type FrameData,
} from '../../services/creativeVision';

type Provider = 'claude' | 'openai';
type CreativeType = 'video' | 'image' | 'carousel';

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

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY_KEY, apiKey);
    sessionStorage.setItem(SESSION_PROVIDER_KEY, provider);
  }, [apiKey, provider]);

  const handleFile = useCallback((f: File) => {
    if (f.size > 50 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 50MB.');
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

  const handleAnalyze = async () => {
    if (!file || !apiKey) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      let extractedFrames: FrameData[];

      if (creativeType === 'video' && videoRef.current) {
        extractedFrames = await extractVideoFrames(videoRef.current, 6);
      } else {
        const frame = await imageToFrame(file);
        extractedFrames = [frame];
      }

      setFrames(extractedFrames);

      const analysisResult = provider === 'claude'
        ? await analyzeCreative(extractedFrames, apiKey, creativeType)
        : await analyzeCreativeOpenAI(extractedFrames, apiKey, creativeType);

      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido na análise');
    } finally {
      setAnalyzing(false);
    }
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
      </AlpineCard>

      {/* Upload Area */}
      <AlpineCard padding={0}>
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
                MP4, MOV, JPG, PNG, WebP — Máx 50MB
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
          onClick={handleAnalyze}
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
          {analyzing ? 'Analisando...' : 'Analisar Criativo'}
        </button>
      </div>

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
          {/* Score + Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {/* Score Card */}
            <AlpineCard padding={24}>
              <p style={{ ...labelStyle, marginBottom: 16 }}>Score do Criativo</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative', width: 100, height: 100 }}>
                  <svg viewBox="0 0 100 100" width={100} height={100}>
                    <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth={8} />
                    <motion.circle
                      cx={50} cy={50} r={40} fill="none"
                      stroke={result.score >= 70 ? '#10b981' : result.score >= 40 ? '#f59e0b' : '#ef4444'}
                      strokeWidth={8} strokeLinecap="round"
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
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Tom</span>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '2px 0 0' }}>{result.tone}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {result.colors.map((c, i) => (
                      <div key={i} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: '1px solid rgba(15,23,42,0.1)' }} title={c} />
                    ))}
                  </div>
                </div>
              </div>
            </AlpineCard>

            {/* Tags Card */}
            <AlpineCard padding={24}>
              <p style={{ ...labelStyle, marginBottom: 16 }}>Tags do Criativo</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Hook */}
                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={12} style={{ color: '#6366f1' }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6366f1' }}>{result.hookType}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#6366f1', fontFamily: "'JetBrains Mono', monospace" }}>{result.hookScore}/10</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', margin: 0 }}>"{result.hookText}"</p>
                </div>
                {/* CTA */}
                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Target size={12} style={{ color: '#f59e0b' }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>{result.ctaType}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace" }}>{result.ctaScore}/10</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>"{result.ctaText}"</p>
                </div>
                {/* Elements */}
                <div>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em' }}>Elementos</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {result.elements.map((e, i) => (
                      <span key={i} style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 8,
                        background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.08)',
                        color: '#334155',
                      }}>{e}</span>
                    ))}
                  </div>
                </div>
              </div>
            </AlpineCard>
          </div>

          {/* Frames */}
          {frames.length > 1 && (
            <AlpineCard padding={20}>
              <p style={{ ...labelStyle, marginBottom: 14 }}>Frames Extraídos</p>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                {frames.map((f, i) => (
                  <div key={i} style={{ minWidth: 140, flexShrink: 0 }}>
                    <img src={f.dataUrl} alt={f.timestamp} style={{ width: 140, height: 80, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(15,23,42,0.08)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{f.timestamp}</span>
                      {f.isHook && (
                        <span style={{ fontSize: 9, fontWeight: 600, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '2px 6px', borderRadius: 6, textTransform: 'uppercase' }}>Hook</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AlpineCard>
          )}

          {/* Insights */}
          <AlpineCard padding={20}>
            <p style={{ ...labelStyle, marginBottom: 14 }}>Insights da IA</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.insights.map((ins, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < result.insights.length - 1 ? '1px solid rgba(15,23,42,0.05)' : 'none' }}>
                  {insightIcon[ins.type]}
                  <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </AlpineCard>

          {/* Summary */}
          <AlpineCard padding={20}>
            <p style={{ ...labelStyle, marginBottom: 10 }}>Resumo da Análise</p>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
              "{result.summary}"
            </p>
          </AlpineCard>
        </motion.div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </motion.div>
  );
}
