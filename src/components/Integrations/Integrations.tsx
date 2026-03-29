import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plug, Globe, Search, Zap, Music, Radio, Code2, MessageCircle, TestTube,
  ChevronRight, Plus, RefreshCw, Copy, Check, Download,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { COLORS, COLORS_LIGHT } from '../../utils/constants';

type TabId = 'anuncios' | 'webhooks' | 'utms' | 'pixel' | 'whatsapp' | 'testes';

const TABS: { id: TabId; label: string }[] = [
  { id: 'anuncios', label: 'Anuncios' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'utms', label: 'UTMs' },
  { id: 'pixel', label: 'Pixel' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'testes', label: 'Testes' },
];

const AD_PLATFORMS = [
  { id: 'meta', name: 'Meta Ads', icon: Globe, color: '#1877F2' },
  { id: 'google', name: 'Google Ads', icon: Search, color: '#4285F4' },
  { id: 'kwai', name: 'Kwai Ads', icon: Zap, color: '#FF6600' },
  { id: 'tiktok', name: 'TikTok Ads', icon: Music, color: '#010101' },
];

const UTM_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', desc: 'Parametros UTM para campanhas do Facebook Ads', icon: Globe, color: '#1877F2' },
  { id: 'google', name: 'Google', desc: 'Parametros UTM para campanhas do Google Ads', icon: Search, color: '#4285F4' },
  { id: 'kwai', name: 'Kwai', desc: 'Parametros UTM para campanhas do Kwai Ads', icon: Zap, color: '#FF6600' },
  { id: 'tiktok', name: 'TikTok', desc: 'Parametros UTM para campanhas do TikTok Ads', icon: Music, color: '#010101' },
];

export default function Integrations() {
  const theme = useStore((s) => s.theme);
  const isMobile = useIsMobile();
  const c = theme === 'dark' ? COLORS : COLORS_LIGHT;
  const [activeTab, setActiveTab] = useState<TabId>('anuncios');
  const [fonte, setFonte] = useState('');
  const [plataforma, setPlataforma] = useState('');
  const [usaPixel, setUsaPixel] = useState(false);
  const [testLink, setTestLink] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 16,
    background: c.surface2,
    border: `1px solid ${c.border}`,
  };

  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: c.accent,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const btnOutline: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 10,
    border: `1px solid ${c.border}`,
    background: 'transparent',
    color: c.accent,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${c.border}`,
    background: c.surface3,
    color: c.text,
    fontSize: 13,
    fontFamily: 'Outfit',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none' as const,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: c.textMuted,
    marginBottom: 6,
    display: 'block',
  };

  // --- Tab Content Renderers ---

  function renderAnuncios() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {AD_PLATFORMS.map((platform, i) => (
          <motion.div
            key={platform.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card"
            style={{
              ...cardStyle,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            whileHover={{ borderColor: c.borderHover }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: platform.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <platform.icon size={18} color="#fff" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{platform.name}</span>
            </div>
            <ChevronRight size={18} color={c.textMuted} />
          </motion.div>
        ))}
      </div>
    );
  }

  function renderWebhooks() {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
        {/* Webhooks */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Radio size={18} color={c.accent} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Webhooks</h3>
          </div>
          <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>
            Configure webhooks para receber eventos de vendas e conversoes em tempo real.
          </p>

          {/* Empty state placeholder webhook */}
          <div style={{
            padding: 16, borderRadius: 12, background: c.surface3, border: `1px solid ${c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: c.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Radio size={16} color={c.accent} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>Webhook Exemplo</div>
                <div style={{ fontSize: 11, color: c.warning }}>Status: Desativado</div>
              </div>
            </div>
          </div>

          <button style={btnPrimary}>
            <Plus size={16} /> Adicionar Webhook
          </button>
        </motion.div>

        {/* Credenciais de API */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Code2 size={18} color={c.accent} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Credenciais de API</h3>
          </div>
          <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>
            Gerencie suas credenciais de API para integracoes externas.
          </p>

          <div style={{
            padding: 24, borderRadius: 12, background: c.surface3, border: `1px dashed ${c.border}`,
            textAlign: 'center', marginBottom: 16,
          }}>
            <p style={{ fontSize: 13, color: c.textMuted }}>Nenhuma credencial configurada</p>
          </div>

          <button style={btnPrimary}>
            <Plus size={16} /> Adicionar Credencial
          </button>
        </motion.div>
      </div>
    );
  }

  function renderUTMs() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Codigos */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk', marginBottom: 14 }}>Codigos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {UTM_PLATFORMS.map((platform, i) => (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card"
                style={{
                  ...cardStyle,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  justifyContent: 'space-between',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 12 : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: platform.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <platform.icon size={16} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{platform.name}</div>
                    <div style={{ fontSize: 12, color: c.textMuted }}>{platform.desc}</div>
                  </div>
                </div>
                <button style={btnPrimary}>Ver opcoes</button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scripts */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk', marginBottom: 14 }}>Scripts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Script de UTMs', desc: 'Script para captura automatica de parametros UTM', action: 'Ver opcoes' },
              { name: 'Script de Back Redirect', desc: 'Script para redirecionamento de retorno', action: 'Baixar' },
            ].map((script, i) => (
              <motion.div
                key={script.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card"
                style={{
                  ...cardStyle,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  justifyContent: 'space-between',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 12 : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: c.accentGlow,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Code2 size={16} color={c.accent} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{script.name}</div>
                    <div style={{ fontSize: 12, color: c.textMuted }}>{script.desc}</div>
                  </div>
                </div>
                <button style={script.action === 'Baixar' ? btnOutline : btnPrimary}>
                  {script.action === 'Baixar' && <Download size={14} />}
                  {script.action}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderPixel() {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Code2 size={18} color={c.accent} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Pixels</h3>
        </div>
        <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>
          Utilize Pixels para aumentar a inteligencia das campanhas.
        </p>

        {/* Example pixel row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr 80px',
          gap: 12,
          padding: 14,
          borderRadius: 12,
          background: c.surface3,
          border: `1px solid ${c.border}`,
          alignItems: 'center',
          marginBottom: 16,
          fontSize: 13,
        }}>
          <div>
            <div style={{ fontWeight: 600, color: c.text }}>Pixel Principal</div>
          </div>
          <div>
            <span style={{ color: c.textMuted, fontSize: 11 }}>ID</span>
            <div style={{ color: c.text, fontFamily: 'JetBrains Mono', fontSize: 12 }}>123456789</div>
          </div>
          <div>
            <span style={{ color: c.textMuted, fontSize: 11 }}>Tipo</span>
            <div style={{ color: c.text, fontSize: 12 }}>Meta</div>
          </div>
          <div>
            <span style={{ color: c.textMuted, fontSize: 11 }}>Produto</span>
            <div style={{ color: c.text, fontSize: 12 }}>Produto A</div>
          </div>
          <div>
            <span style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: 'rgba(16,185,129,0.12)', color: c.success,
            }}>Ativo</span>
          </div>
        </div>

        <button style={btnPrimary}>
          <Plus size={16} /> Adicionar Pixel
        </button>
      </motion.div>
    );
  }

  function renderWhatsApp() {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <MessageCircle size={18} color={c.success} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Numeros de WhatsApp</h3>
        </div>
        <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>
          Adicione numeros de WhatsApp para receber notificacoes e integrar com suas campanhas.
        </p>

        <div style={{
          padding: 32, borderRadius: 12, background: c.surface3, border: `1px dashed ${c.border}`,
          textAlign: 'center', marginBottom: 16,
        }}>
          <MessageCircle size={32} color={c.textDim} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: c.textMuted }}>Nenhum numero cadastrado</p>
        </div>

        <button style={btnPrimary}>
          <Plus size={16} /> Adicionar Numero
        </button>
      </motion.div>
    );
  }

  function renderTestes() {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <TestTube size={18} color={c.accent} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Teste a integracao</h3>
          </div>
          <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>
            Simule um clique para verificar se os parametros estao sendo capturados corretamente.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Fonte de Trafego</label>
              <select value={fonte} onChange={e => setFonte(e.target.value)} style={selectStyle}>
                <option value="">Selecione...</option>
                <option value="facebook">Facebook</option>
                <option value="google">Google</option>
                <option value="tiktok">TikTok</option>
                <option value="kwai">Kwai</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Plataforma</label>
              <select value={plataforma} onChange={e => setPlataforma(e.target.value)} style={selectStyle}>
                <option value="">Selecione...</option>
                <option value="hotmart">Hotmart</option>
                <option value="kiwify">Kiwify</option>
                <option value="monetizze">Monetizze</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                onClick={() => setUsaPixel(!usaPixel)}
                style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: `2px solid ${usaPixel ? c.accent : c.border}`,
                  background: usaPixel ? c.accent : 'transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {usaPixel && <Check size={12} color="#fff" />}
              </div>
              <span style={{ fontSize: 13, color: c.text }}>Utiliza o Pixel?</span>
            </div>

            <div>
              <label style={labelStyle}>Link</label>
              <input
                type="text"
                value={testLink}
                onChange={e => setTestLink(e.target.value)}
                placeholder="https://seusite.com/pagina"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleCopy(testLink, 'test-link')} style={btnOutline}>
                {copiedField === 'test-link' ? <Check size={14} /> : <Copy size={14} />}
                Copiar
              </button>
              <button style={btnPrimary}>
                <TestTube size={14} /> Testar
              </button>
            </div>
          </div>
        </motion.div>

        {/* Ultimos testes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Ultimos testes</h3>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 4 }}>
              <RefreshCw size={16} />
            </button>
          </div>

          <div style={{
            padding: 40, borderRadius: 12, background: c.surface3, border: `1px dashed ${c.border}`,
            textAlign: 'center',
          }}>
            <TestTube size={32} color={c.textDim} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: c.textMuted }}>Nenhum teste realizado ainda</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const tabContent: Record<TabId, () => React.JSX.Element> = {
    anuncios: renderAnuncios,
    webhooks: renderWebhooks,
    utms: renderUTMs,
    pixel: renderPixel,
    whatsapp: renderWhatsApp,
    testes: renderTestes,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Plug size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Integracoes</h1>
          <p style={{ fontSize: 13, color: c.textMuted }}>Plataformas de anuncios, webhooks, UTMs, pixels e testes</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: 4, borderRadius: 12,
        background: c.surface2, border: `1px solid ${c.border}`,
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: isMobile ? 'none' : 1,
              padding: isMobile ? '10px 14px' : '10px 16px',
              borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? c.accent : 'transparent',
              color: activeTab === tab.id ? '#fff' : c.textMuted,
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tabContent[activeTab]()}
    </div>
  );
}
