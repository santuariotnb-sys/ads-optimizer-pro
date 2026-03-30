import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plug, Globe, Search, Zap, Music, Radio, Code2, MessageCircle, TestTube,
  ChevronRight, Plus, RefreshCw, Copy, Check, Download, X, MoreVertical,
  Link2, Trash2, Mail, Phone, Camera,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { COLORS, COLORS_LIGHT } from '../../utils/constants';

type TabId = 'anuncios' | 'webhooks' | 'utms' | 'pixel' | 'whatsapp' | 'testes';

interface Webhook { id: string; name: string; platform: string; active: boolean }
interface Credential { id: string; name: string; active: boolean }
interface Pixel { id: string; name: string; pixelId: string; type: string; product: string; active: boolean }

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

const UTM_TEMPLATES: Record<string, string> = {
  facebook: 'utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}',
  google: 'utm_source=GOOGLE&utm_campaign={campaignname}|{campaignid}&utm_medium={adgroupname}|{adgroupid}&utm_content={creative}&utm_term={keyword}',
  kwai: 'utm_source=KWAI&utm_campaign=__CAMPAIGN_NAME__|__CAMPAIGN_ID__&utm_medium=__ADGROUP_NAME__|__ADGROUP_ID__&utm_content=__CREATIVE_NAME__|__CREATIVE_ID__&utm_term=__PLACEMENT__',
  tiktok: 'utm_source=TIKTOK&utm_campaign=__CAMPAIGN_NAME__|__CAMPAIGN_ID__&utm_medium=__AID_NAME__|__AID_ID__&utm_content=__CID_NAME__|__CID_ID__&utm_term=__PLACEMENT__',
};

const UTM_PLATFORMS = [
  { id: 'facebook', name: 'Codigo de UTMs do Facebook', icon: Globe, color: '#1877F2' },
  { id: 'google', name: 'Codigo de UTMs do Google', icon: Search, color: '#4285F4' },
  { id: 'kwai', name: 'Codigo de UTMs do Kwai', icon: Zap, color: '#FF6600' },
  { id: 'tiktok', name: 'Codigo de UTMs do TikTok', icon: Music, color: '#010101' },
];

const SALES_PLATFORMS = ['Hotmart', 'Kiwify', 'Cartpanda', 'Outra'];

let _id = 0;
const uid = () => `id-${++_id}`;

export default function Integrations() {
  const theme = useStore((s) => s.theme);
  const isMobile = useIsMobile();
  const c = theme === 'dark' ? COLORS : COLORS_LIGHT;
  const [activeTab, setActiveTab] = useState<TabId>('anuncios');

  // Anuncios
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  // Webhooks & Credentials
  const [webhooks, setWebhooks] = useState<Webhook[]>([{ id: 'wh-1', name: 'Webhook Exemplo', platform: 'Hotmart', active: false }]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [newCredName, setNewCredName] = useState('');

  // UTMs
  const [utmModal, setUtmModal] = useState<string | null>(null);

  // UTM Generator
  const [utmUrl, setUtmUrl] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmErrors, setUtmErrors] = useState<{ source?: boolean; medium?: boolean }>({});

  // Pixel
  const [pixels, setPixels] = useState<Pixel[]>([{ id: 'px-1', name: 'Pixel Principal', pixelId: '123456789', type: 'Meta', product: 'Qualquer', active: false }]);
  const [showPixelDrawer, setShowPixelDrawer] = useState(false);
  const [pixelForm, setPixelForm] = useState({ name: '', type: 'Meta (Facebook)', leadRule: 'Desabilitado', atcRule: 'Desabilitado', icRule: 'Habilitado', icText: 'COMPRAR AGORA', purchaseRule: 'Apenas vendas aprovadas', purchaseValue: 'Valor da venda', product: 'Qualquer', ipRule: 'Enviar IPv6 se houver. Enviar IPv4 se nao houver IPv6' });

  // Testes
  const [fonte, setFonte] = useState('');
  const [plataforma, setPlataforma] = useState('');
  const [usaPixel, setUsaPixel] = useState(false);
  const [testLink, setTestLink] = useState('');

  // Shared
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const UTM_PRESETS = [
    { label: 'Meta Ads', source: 'facebook', medium: 'cpc', icon: Globe, color: '#1877F2' },
    { label: 'Google Ads', source: 'google', medium: 'cpc', icon: Search, color: '#4285F4' },
    { label: 'TikTok Ads', source: 'tiktok', medium: 'cpc', icon: Music, color: '#010101' },
    { label: 'Kwai Ads', source: 'kwai', medium: 'cpc', icon: Zap, color: '#FF6600' },
    { label: 'Email', source: 'email', medium: 'email', icon: Mail, color: '#EA4335' },
    { label: 'WhatsApp', source: 'whatsapp', medium: 'social', icon: Phone, color: '#25D366' },
    { label: 'Orgânico IG', source: 'instagram', medium: 'organic', icon: Camera, color: '#E4405F' },
  ];

  function sanitizeUtm(val: string) {
    return val.toLowerCase().replace(/\s+/g, '_');
  }

  function buildUtmUrl() {
    const base = utmUrl.trim();
    if (!base) return '';
    const params = [
      utmSource && `utm_source=${encodeURIComponent(sanitizeUtm(utmSource))}`,
      utmMedium && `utm_medium=${encodeURIComponent(sanitizeUtm(utmMedium))}`,
      utmCampaign && `utm_campaign=${encodeURIComponent(sanitizeUtm(utmCampaign))}`,
      utmContent && `utm_content=${encodeURIComponent(sanitizeUtm(utmContent))}`,
      utmTerm && `utm_term=${encodeURIComponent(sanitizeUtm(utmTerm))}`,
    ].filter(Boolean).join('&');
    if (!params) return base;
    return `${base}${base.includes('?') ? '&' : '?'}${params}`;
  }

  function handleCopyUtmLink() {
    const errors: { source?: boolean; medium?: boolean } = {};
    if (!utmSource.trim()) errors.source = true;
    if (!utmMedium.trim()) errors.medium = true;
    if (errors.source || errors.medium) { setUtmErrors(errors); return; }
    setUtmErrors({});
    const link = buildUtmUrl();
    if (link) handleCopy(link, 'utm-link');
  }

  function clearUtmGenerator() {
    setUtmUrl(''); setUtmSource(''); setUtmMedium(''); setUtmCampaign(''); setUtmContent(''); setUtmTerm(''); setUtmErrors({});
  }

  function applyUtmPreset(source: string, medium: string) {
    setUtmSource(source); setUtmMedium(medium); setUtmErrors({});
  }

  const card: React.CSSProperties = { padding: 20, borderRadius: 16, background: c.surface2, border: `1px solid ${c.border}` };
  const btn: React.CSSProperties = { padding: '10px 20px', borderRadius: 10, border: 'none', background: c.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 };
  const btnOut: React.CSSProperties = { ...btn, background: 'transparent', border: `1px solid ${c.border}`, color: c.accent };
  const input: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface3, color: c.text, fontSize: 13, fontFamily: 'Outfit', boxSizing: 'border-box' };
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 6, display: 'block' };

  // --- Overlay / Backdrop ---
  function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return createPortal(
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div onClick={e => e.stopPropagation()}>{children}</div>
      </motion.div>,
      document.body,
    );
  }

  // --- ANUNCIOS ---
  function renderAnuncios() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {AD_PLATFORMS.map((p, i) => {
          const open = expandedPlatform === p.id;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card" style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div onClick={() => setExpandedPlatform(open ? null : p.id)}
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p.icon size={18} color="#fff" />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{p.name}</span>
                </div>
                <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight size={18} color={c.textMuted} />
                </motion.div>
              </div>
              <AnimatePresence>
                {open && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                    style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${c.border}`, paddingTop: 16 }}>
                      <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 12 }}>Conecte seus perfis por aqui:</p>
                      <button style={btn} onClick={() => {
                        if (p.id === 'meta') {
                          const clientId = import.meta.env.VITE_META_APP_ID;
                          if (!clientId) { alert('Configure VITE_META_APP_ID no .env para conectar Meta Ads'); return; }
                          const redirect = import.meta.env.VITE_META_REDIRECT_URI || `${window.location.origin}/auth/callback`;
                          window.location.href = `https://www.facebook.com/v25.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&scope=ads_read,ads_management`;
                        } else {
                          alert(`Integração com ${p.name} será disponibilizada em breve`);
                        }
                      }}><Plus size={14} /> Adicionar perfil</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // --- WEBHOOKS ---
  function renderWebhooks() {
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Radio size={18} color={c.accent} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Webhooks</h3>
            </div>
            <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Adicione webhooks para se conectar com as plataformas de venda</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {webhooks.map(wh => (
                <div key={wh.id} style={{ padding: 14, borderRadius: 12, background: c.surface3, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: c.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Radio size={16} color={c.accent} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{wh.name}</div>
                      <div style={{ fontSize: 11, color: c.warning }}>Status: Desativado</div>
                    </div>
                  </div>
                  <MoreVertical size={16} color={c.textMuted} style={{ cursor: 'pointer' }} />
                </div>
              ))}
            </div>
            <button style={btn} onClick={() => {
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
              const webhookUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/webhook-sales` : 'https://seu-projeto.supabase.co/functions/v1/webhook-sales';
              setWebhooks(prev => [...prev, { id: uid(), name: `Webhook ${prev.length + 1}`, platform: 'Custom', active: false }]);
              navigator.clipboard.writeText(webhookUrl);
              setCopiedField('new-webhook');
              setTimeout(() => setCopiedField(null), 2000);
              alert(`Webhook criado! URL copiada para a área de transferência:\n\n${webhookUrl}`);
            }}>
              <Plus size={16} /> Adicionar Webhook
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card" style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Code2 size={18} color={c.accent} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Credenciais de API</h3>
            </div>
            <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Gerencie suas credenciais de API para integracoes externas.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {credentials.length === 0 && (
                <div style={{ padding: 24, borderRadius: 12, background: c.surface3, border: `1px dashed ${c.border}`, textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: c.textMuted }}>Nenhuma credencial configurada</p>
                </div>
              )}
              {credentials.map(cr => (
                <div key={cr.id} style={{ padding: 14, borderRadius: 12, background: c.surface3, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{cr.name}</div>
                    <div style={{ fontSize: 11, color: c.warning }}>Status: Desativado</div>
                  </div>
                  <MoreVertical size={16} color={c.textMuted} style={{ cursor: 'pointer' }} />
                </div>
              ))}
            </div>
            <button style={btn} onClick={() => { setNewCredName(''); setShowCredentialModal(true); }}>
              <Plus size={16} /> Adicionar Credencial
            </button>
          </motion.div>
        </div>

        <AnimatePresence>
          {showCredentialModal && (
            <Overlay onClose={() => setShowCredentialModal(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                style={{ ...card, background: c.surface, width: 400, maxWidth: '90vw', padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Criar Credencial de API</h3>
                  <X size={18} color={c.textMuted} style={{ cursor: 'pointer' }} onClick={() => setShowCredentialModal(false)} />
                </div>
                <label style={label}>Nome</label>
                <input value={newCredName} onChange={e => setNewCredName(e.target.value)} placeholder="Nome da credencial" style={{ ...input, marginBottom: 20 }} />
                <button style={btn} onClick={() => { if (newCredName.trim()) { setCredentials(prev => [...prev, { id: uid(), name: newCredName.trim(), active: false }]); setShowCredentialModal(false); } }}>
                  Criar Credencial
                </button>
              </motion.div>
            </Overlay>
          )}
        </AnimatePresence>
      </>
    );
  }

  // --- UTMs ---
  function renderUTMs() {
    const generatedUrl = buildUtmUrl();
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* UTM Link Generator */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Link2 size={18} color={c.accent} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Gerador de Links UTM</h3>
            </div>
            <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 16 }}>Crie links rastreáveis com parâmetros UTM para suas campanhas.</p>

            <div style={{ marginBottom: 14 }}>
              <label style={label}>URL da página</label>
              <input value={utmUrl} onChange={e => setUtmUrl(e.target.value)} placeholder="https://seusite.com/oferta" style={input} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={label}>Templates</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {UTM_PRESETS.map(p => (
                  <button key={p.label} onClick={() => applyUtmPreset(p.source, p.medium)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${utmSource === p.source && utmMedium === p.medium ? p.color : c.border}`, background: utmSource === p.source && utmMedium === p.medium ? `${p.color}22` : c.surface3, color: utmSource === p.source && utmMedium === p.medium ? p.color : c.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s' }}>
                    <p.icon size={12} /> {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={label}>utm_source *</label>
                <input value={utmSource} onChange={e => { setUtmSource(e.target.value); setUtmErrors(prev => ({ ...prev, source: false })); }} placeholder="facebook" style={{ ...input, borderColor: utmErrors.source ? '#f87171' : c.border }} />
              </div>
              <div>
                <label style={label}>utm_medium *</label>
                <input value={utmMedium} onChange={e => { setUtmMedium(e.target.value); setUtmErrors(prev => ({ ...prev, medium: false })); }} placeholder="cpc" style={{ ...input, borderColor: utmErrors.medium ? '#f87171' : c.border }} />
              </div>
              <div>
                <label style={label}>utm_campaign</label>
                <input value={utmCampaign} onChange={e => setUtmCampaign(e.target.value)} placeholder="black_friday" style={input} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={label}>utm_content</label>
                <input value={utmContent} onChange={e => setUtmContent(e.target.value)} placeholder="banner_topo" style={input} />
              </div>
              <div>
                <label style={label}>utm_term</label>
                <input value={utmTerm} onChange={e => setUtmTerm(e.target.value)} placeholder="comprar_curso" style={input} />
              </div>
            </div>

            {generatedUrl && (
              <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, background: c.surface3, border: `1px solid ${c.border}`, wordBreak: 'break-all' }}>
                <label style={{ ...label, marginBottom: 4 }}>Link gerado</label>
                <p style={{ fontSize: 12, color: c.accent, fontFamily: 'JetBrains Mono', margin: 0 }}>{generatedUrl}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={btn} onClick={handleCopyUtmLink}>
                {copiedField === 'utm-link' ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar Link</>}
              </button>
              <button style={btnOut} onClick={clearUtmGenerator}><Trash2 size={14} /> Limpar</button>
            </div>
          </motion.div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk', marginBottom: 14 }}>Codigos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {UTM_PLATFORMS.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass-card" style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p.icon size={16} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: c.textMuted }}>Copie o codigo para colocar nos anuncios</div>
                    </div>
                  </div>
                  <button style={btn} onClick={() => setUtmModal(p.id)}>Ver opcoes</button>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk', marginBottom: 14 }}>Scripts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[{ name: 'Script de UTMs', action: 'opcoes' }, { name: 'Script de Back Redirect', action: 'baixar' }].map((s, i) => (
                <motion.div key={s.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass-card" style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: c.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Code2 size={16} color={c.accent} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{s.name}</div>
                  </div>
                  <button style={s.action === 'baixar' ? btnOut : btn}>
                    {s.action === 'baixar' && <Download size={14} />}
                    {s.action === 'baixar' ? 'Baixar' : 'Ver opcoes'}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {utmModal && (
            <Overlay onClose={() => setUtmModal(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                style={{ ...card, background: c.surface, width: 520, maxWidth: '90vw', padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {(() => { const p = UTM_PLATFORMS.find(x => x.id === utmModal)!; return <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p.icon size={14} color="#fff" /></div>; })()}
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>{UTM_PLATFORMS.find(x => x.id === utmModal)?.name}</h3>
                  </div>
                  <X size={18} color={c.textMuted} style={{ cursor: 'pointer' }} onClick={() => setUtmModal(null)} />
                </div>
                <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Obtenha os codigos de UTMs apropriados para a sua plataforma de vendas:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {SALES_PLATFORMS.map(sp => {
                    const key = `${utmModal}-${sp}`;
                    return (
                      <div key={sp} style={{ padding: 14, borderRadius: 12, background: c.surface3, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{sp}</span>
                        <button style={{ ...btn, padding: '8px 16px' }} onClick={() => handleCopy(UTM_TEMPLATES[utmModal!] || '', key)}>
                          {copiedField === key ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 11, color: c.textDim, marginTop: 14 }}>Utiliza cloaker? Clique aqui para verificar os codigos compativeis.</p>
              </motion.div>
            </Overlay>
          )}
        </AnimatePresence>
      </>
    );
  }

  // --- PIXEL ---
  function renderPixel() {
    return (
      <>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Code2 size={18} color={c.accent} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Pixels</h3>
          </div>
          <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Utilize Pixels para aumentar a inteligencia das campanhas.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {pixels.map(px => (
              <div key={px.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr 80px', gap: 12, padding: 14, borderRadius: 12, background: c.surface3, border: `1px solid ${c.border}`, alignItems: 'center', fontSize: 13 }}>
                <div style={{ fontWeight: 600, color: c.text }}>{px.name}</div>
                <div><span style={{ color: c.textMuted, fontSize: 11 }}>ID</span><div style={{ color: c.text, fontFamily: 'JetBrains Mono', fontSize: 12 }}>{px.pixelId}</div></div>
                <div><span style={{ color: c.textMuted, fontSize: 11 }}>Tipo</span><div style={{ color: c.text, fontSize: 12 }}>{px.type}</div></div>
                <div><span style={{ color: c.textMuted, fontSize: 11 }}>Produto</span><div style={{ color: c.text, fontSize: 12 }}>{px.product}</div></div>
                <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: px.active ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: px.active ? c.success : c.warning, textAlign: 'center' }}>
                  {px.active ? 'Ativo' : 'Desativado'}
                </span>
              </div>
            ))}
          </div>
          <button style={btn} onClick={() => { setPixelForm({ name: '', type: 'Meta (Facebook)', leadRule: 'Desabilitado', atcRule: 'Desabilitado', icRule: 'Habilitado', icText: 'COMPRAR AGORA', purchaseRule: 'Apenas vendas aprovadas', purchaseValue: 'Valor da venda', product: 'Qualquer', ipRule: 'Enviar IPv6 se houver. Enviar IPv4 se nao houver IPv6' }); setShowPixelDrawer(true); }}>
            <Plus size={16} /> Adicionar Pixel
          </button>
        </motion.div>

        <AnimatePresence>
          {showPixelDrawer && createPortal(
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPixelDrawer(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                style={{ width: isMobile ? '100%' : 460, height: '100%', background: c.surface, borderLeft: `1px solid ${c.border}`, overflowY: 'auto', padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Adicionar Pixel</h3>
                  <X size={18} color={c.textMuted} style={{ cursor: 'pointer' }} onClick={() => setShowPixelDrawer(false)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div><label style={label}>Nome</label><input value={pixelForm.name} onChange={e => setPixelForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome do pixel" style={input} /></div>
                  <div><label style={label}>Tipo de Pixel</label><select value={pixelForm.type} onChange={e => setPixelForm(p => ({ ...p, type: e.target.value }))} style={{ ...input, appearance: 'none' as const }}><option>Meta (Facebook)</option><option>Google</option><option>TikTok</option></select></div>
                  <div style={{ padding: 14, borderRadius: 12, background: c.surface3, border: `1px solid ${c.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>Pixels da Meta</div>
                    <button style={{ ...btnOut, padding: '6px 14px', fontSize: 12 }}><Plus size={12} /> Adicionar +</button>
                  </div>
                  <div><label style={label}>Regra de Lead: Envio de Lead</label><select value={pixelForm.leadRule} onChange={e => setPixelForm(p => ({ ...p, leadRule: e.target.value }))} style={{ ...input, appearance: 'none' as const }}><option>Desabilitado</option><option>Habilitado</option></select></div>
                  <div><label style={label}>Regra de Add To Cart</label><select value={pixelForm.atcRule} onChange={e => setPixelForm(p => ({ ...p, atcRule: e.target.value }))} style={{ ...input, appearance: 'none' as const }}><option>Desabilitado</option><option>Habilitado</option></select></div>
                  <div>
                    <label style={label}>Regra de Initiate Checkout</label>
                    <select value={pixelForm.icRule} onChange={e => setPixelForm(p => ({ ...p, icRule: e.target.value }))} style={{ ...input, appearance: 'none' as const, marginBottom: 8 }}><option>Desabilitado</option><option>Habilitado</option></select>
                    {pixelForm.icRule === 'Habilitado' && (
                      <div style={{ marginTop: 8 }}>
                        <label style={label}>Regra de Deteccao (Contem texto)</label>
                        <input value={pixelForm.icText} onChange={e => setPixelForm(p => ({ ...p, icText: e.target.value }))} style={input} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={label}>Regra de Purchase</label>
                    <select value={pixelForm.purchaseRule} onChange={e => setPixelForm(p => ({ ...p, purchaseRule: e.target.value }))} style={{ ...input, appearance: 'none' as const, marginBottom: 8 }}><option>Apenas vendas aprovadas</option><option>Todas as vendas</option></select>
                    <label style={label}>Valor</label>
                    <select value={pixelForm.purchaseValue} onChange={e => setPixelForm(p => ({ ...p, purchaseValue: e.target.value }))} style={{ ...input, appearance: 'none' as const, marginBottom: 8 }}><option>Valor da venda</option><option>Valor customizado</option></select>
                    <label style={label}>Produto</label>
                    <select value={pixelForm.product} onChange={e => setPixelForm(p => ({ ...p, product: e.target.value }))} style={{ ...input, appearance: 'none' as const }}><option>Qualquer</option><option>Produto A</option><option>Produto B</option></select>
                  </div>
                  <div><label style={label}>Envio de IP</label><select value={pixelForm.ipRule} onChange={e => setPixelForm(p => ({ ...p, ipRule: e.target.value }))} style={{ ...input, appearance: 'none' as const }}><option>Enviar IPv6 se houver. Enviar IPv4 se nao houver IPv6</option><option>Sempre enviar IPv4</option></select></div>
                  <button style={{ ...btn, background: c.text, color: c.bg, justifyContent: 'center', width: '100%', padding: '14px 20px' }}
                    onClick={() => {
                      if (pixelForm.name.trim()) {
                        setPixels(prev => [...prev, { id: uid(), name: pixelForm.name.trim(), pixelId: String(Math.floor(Math.random() * 900000000) + 100000000), type: pixelForm.type.split(' ')[0], product: pixelForm.product, active: false }]);
                        setShowPixelDrawer(false);
                      }
                    }}>
                    Salvar Dados
                  </button>
                </div>
              </motion.div>
            </motion.div>,
            document.body,
          )}
        </AnimatePresence>
      </>
    );
  }

  // --- WHATSAPP ---
  function renderWhatsApp() {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <MessageCircle size={18} color={c.success} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Numeros de WhatsApp</h3>
        </div>
        <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Adicione numeros de WhatsApp para receber notificacoes e integrar com suas campanhas.</p>
        <div style={{ padding: 32, borderRadius: 12, background: c.surface3, border: `1px dashed ${c.border}`, textAlign: 'center', marginBottom: 16 }}>
          <MessageCircle size={32} color={c.textDim} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: c.textMuted }}>Nenhum numero cadastrado</p>
        </div>
        <button style={btn}><Plus size={16} /> Adicionar Numero</button>
      </motion.div>
    );
  }

  // --- TESTES ---
  function renderTestes() {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <TestTube size={18} color={c.accent} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Teste a integracao</h3>
          </div>
          <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Simule um clique para verificar se os parametros estao sendo capturados corretamente.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={label}>Fonte de Trafego</label><select value={fonte} onChange={e => setFonte(e.target.value)} style={{ ...input, appearance: 'none' as const }}><option value="">Selecione...</option><option value="facebook">Facebook</option><option value="google">Google</option><option value="tiktok">TikTok</option><option value="kwai">Kwai</option></select></div>
            <div><label style={label}>Plataforma</label><select value={plataforma} onChange={e => setPlataforma(e.target.value)} style={{ ...input, appearance: 'none' as const }}><option value="">Selecione...</option><option value="hotmart">Hotmart</option><option value="kiwify">Kiwify</option><option value="monetizze">Monetizze</option></select></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div onClick={() => setUsaPixel(!usaPixel)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${usaPixel ? c.accent : c.border}`, background: usaPixel ? c.accent : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                {usaPixel && <Check size={12} color="#fff" />}
              </div>
              <span style={{ fontSize: 13, color: c.text }}>Utiliza o Pixel?</span>
            </div>
            <div><label style={label}>Link</label><input type="text" value={testLink} onChange={e => setTestLink(e.target.value)} placeholder="https://seusite.com/pagina" style={input} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleCopy(testLink, 'test-link')} style={btnOut}>{copiedField === 'test-link' ? <Check size={14} /> : <Copy size={14} />} Copiar</button>
              <button style={btn}><TestTube size={14} /> Testar</button>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Ultimos testes</h3>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 4 }}><RefreshCw size={16} /></button>
          </div>
          <div style={{ padding: 40, borderRadius: 12, background: c.surface3, border: `1px dashed ${c.border}`, textAlign: 'center' }}>
            <TestTube size={32} color={c.textDim} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: c.textMuted }}>Nenhum teste realizado ainda</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const tabContent: Record<TabId, () => React.JSX.Element> = { anuncios: renderAnuncios, webhooks: renderWebhooks, utms: renderUTMs, pixel: renderPixel, whatsapp: renderWhatsApp, testes: renderTestes };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plug size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Integracoes</h1>
          <p style={{ fontSize: 13, color: c.textMuted }}>Plataformas de anuncios, webhooks, UTMs, pixels e testes</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: c.surface2, border: `1px solid ${c.border}`, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: isMobile ? 'none' : 1, padding: isMobile ? '10px 14px' : '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === tab.id ? c.accent : 'transparent', color: activeTab === tab.id ? '#fff' : c.textMuted, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            {tab.label}
          </button>
        ))}
      </div>
      {tabContent[activeTab]()}
    </div>
  );
}
