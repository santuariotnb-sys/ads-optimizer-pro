import { useState } from 'react';
import type { FunnelConfig, SyntheticEventRule } from '../../types/capi';
import { generateTrackingScript, generateInstallSnippet } from '../../services/capi/tracking';
import { Code, Copy, Check, Terminal } from 'lucide-react';
import { COLORS } from '../../utils/constants';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface Props {
  config: FunnelConfig;
  rules: SyntheticEventRule[];
}

export default function TrackingScriptPanel({ config, rules }: Props) {
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState<'full' | 'snippet' | null>(null);
  const [showFull, setShowFull] = useState(false);

  const snippet = generateInstallSnippet(config);
  const fullScript = generateTrackingScript(config, rules);

  const handleCopy = (text: string, type: 'full' | 'snippet') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderRadius: 16, padding: isMobile ? 14 : 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Code size={18} color={COLORS.info} />
        <span style={{ color: COLORS.text, fontSize: isMobile ? 14 : 15, fontWeight: 600 }}>Tracking Script</span>
      </div>

      {/* Quick install snippet */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Instalação Rápida
          </span>
          <button onClick={() => handleCopy(snippet, 'snippet')} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: copied === 'snippet' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(6, 182, 212, 0.15)',
            border: `1px solid ${copied === 'snippet' ? 'rgba(74,222,128,0.3)' : 'rgba(96,165,250,0.3)'}`,
            borderRadius: 6, padding: isMobile ? '8px 12px' : '4px 10px', fontSize: isMobile ? 12 : 11, fontWeight: 500,
            color: copied === 'snippet' ? COLORS.success : COLORS.info, cursor: 'pointer',
            minHeight: isMobile ? 36 : undefined,
          }}>
            {copied === 'snippet' ? <Check size={12} /> : <Copy size={12} />}
            {copied === 'snippet' ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <div style={{
          background: 'rgba(12, 12, 20, 0.6)', border: `1px solid ${COLORS.border}`,
          borderRadius: 10, padding: isMobile ? 10 : 14, overflowX: 'auto',
          WebkitOverflowScrolling: 'touch' as never,
        }}>
          <code style={{
            fontSize: isMobile ? 10 : 11, color: COLORS.info,
            fontFamily: '"IBM Plex Mono", "Fira Code", monospace',
            wordBreak: 'break-all',
          }}>{snippet}</code>
        </div>
      </div>

      {/* Full script toggle */}
      <button onClick={() => setShowFull(!showFull)} style={{
        display: 'flex', alignItems: 'center', gap: 6, width: '100%',
        background: 'rgba(255,200,120,0.04)', border: `1px solid ${COLORS.border}`,
        borderRadius: 8, padding: isMobile ? '12px 14px' : '8px 14px', fontSize: 12, color: COLORS.textMuted,
        minHeight: isMobile ? 44 : undefined,
        cursor: 'pointer',
      }}>
        <Terminal size={14} />
        {showFull ? 'Ocultar script completo' : 'Ver script completo'}
      </button>

      {showFull && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={() => handleCopy(fullScript, 'full')} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: copied === 'full' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${copied === 'full' ? 'rgba(74,222,128,0.3)' : 'rgba(99,102,241,0.3)'}`,
              borderRadius: 6, padding: isMobile ? '8px 12px' : '4px 10px', fontSize: isMobile ? 12 : 11, fontWeight: 500,
              color: copied === 'full' ? COLORS.success : COLORS.accent, cursor: 'pointer',
              minHeight: isMobile ? 36 : undefined,
            }}>
              {copied === 'full' ? <Check size={12} /> : <Copy size={12} />}
              {copied === 'full' ? 'Copiado!' : 'Copiar Script Completo'}
            </button>
          </div>
          <div style={{
            background: 'rgba(12, 12, 20, 0.6)', border: `1px solid ${COLORS.border}`,
            borderRadius: 10, maxHeight: 300, overflow: 'auto',
          }}>
            <pre style={{
              margin: 0, padding: 16, fontSize: 10, lineHeight: 1.5,
              fontFamily: '"IBM Plex Mono", "Fira Code", monospace',
              color: COLORS.text, whiteSpace: 'pre-wrap',
            }}>{fullScript}</pre>
          </div>
        </div>
      )}

      <div style={{
        marginTop: 12, fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5,
        padding: '8px 12px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: 8,
      }}>
        Cole o script antes do <code style={{ color: COLORS.info }}>&lt;/body&gt;</code> da sua LP. Ele coleta scroll, tempo, video, sessões, fbp/fbc automaticamente e dispara eventos sintéticos quando as condições são atingidas.
      </div>
    </div>
  );
}
