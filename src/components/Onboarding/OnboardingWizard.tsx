import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, Check, X, Globe, Zap, Send } from 'lucide-react';
import AlpineCard from '../Layout/AlpineCard';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useStore } from '../../store/useStore';
import { createWorkspace } from '../../services/workspaceService';
import type { WorkspaceInsert } from '../../types/database';

type BusinessType = 'infoproduct' | 'ecommerce' | 'saas' | 'agency' | 'other';

interface WizardData {
  name: string;
  domain: string;
  checkoutDomain: string;
  businessType: BusinessType;
  events: {
    pageView: boolean;
    viewContent: boolean;
    lead: boolean;
    initiateCheckout: boolean;
    purchase: boolean;
    addToCart: boolean;
  };
  syntheticEvents: {
    deepEngagement: boolean;
    highIntentVisitor: boolean;
    qualifiedLead: boolean;
  };
  pixelMeta: string;
  pixelGoogle: string;
  pixelTiktok: string;
  webhookUrl: string;
  capiActive: boolean;
  capiToken: string;
}

const INITIAL_DATA: WizardData = {
  name: '', domain: '', checkoutDomain: '', businessType: 'infoproduct',
  events: { pageView: true, viewContent: false, lead: false, initiateCheckout: false, purchase: false, addToCart: false },
  syntheticEvents: { deepEngagement: false, highIntentVisitor: false, qualifiedLead: false },
  pixelMeta: '', pixelGoogle: '', pixelTiktok: '', webhookUrl: '',
  capiActive: false, capiToken: '',
};

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'infoproduct', label: 'Infoproduto' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'agency', label: 'Agencia' },
  { value: 'other', label: 'Outro' },
];

const STEP_LABELS = ['Projeto', 'Eventos', 'Destinos'];
const STEP_ICONS = [Globe, Zap, Send];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
  color: '#e2e8f0', fontFamily: 'Outfit', fontSize: 14, outline: 'none',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, color: '#94a3b8',
  fontFamily: 'Outfit', marginBottom: 6,
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 24px', borderRadius: 12, border: 'none',
  background: '#6366f1', color: '#fff', fontFamily: 'Outfit',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 8,
};

const btnOutline: React.CSSProperties = {
  ...btnPrimary, background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8',
};

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none',
        background: checked ? '#6366f1' : 'rgba(255,255,255,0.1)',
        position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: checked ? 22 : 3, transition: 'left 0.2s',
      }} />
    </button>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
      {[0, 1, 2].map((i) => {
        const Icon = STEP_ICONS[i];
        const active = i <= current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active ? '#6366f1' : 'rgba(255,255,255,0.08)',
              border: `2px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.12)'}`,
              transition: 'all 0.3s',
            }}>
              {i < current ? <Check size={16} color="#fff" /> : <Icon size={16} color={active ? '#fff' : '#64748b'} />}
            </div>
            {i < 2 && (
              <div style={{
                width: 48, height: 2, background: i < current ? '#6366f1' : 'rgba(255,255,255,0.08)',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OnboardingWizard() {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setCurrentWorkspace = useStore((s) => s.setCurrentWorkspace);
  const setWorkspaces = useStore((s) => s.setWorkspaces);
  const workspaces = useStore((s) => s.workspaces);
  const setOnboardingStep = useStore((s) => s.setOnboardingStep);
  const setCurrentModule = useStore((s) => s.setCurrentModule);

  const update = useCallback(<K extends keyof WizardData>(key: K, val: WizardData[K]) => {
    setData((d) => ({ ...d, [key]: val }));
  }, []);

  const canNext = step === 0 ? data.name.trim() !== '' && data.domain.trim() !== '' : true;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const customEvents: string[] = [];
      if (data.syntheticEvents.deepEngagement) customEvents.push('DeepEngagement');
      if (data.syntheticEvents.highIntentVisitor) customEvents.push('HighIntentVisitor');
      if (data.syntheticEvents.qualifiedLead) customEvents.push('QualifiedLead');

      const insert: WorkspaceInsert = {
        user_id: 'demo-user',
        name: data.name,
        domain: data.domain,
        checkout_domain: data.checkoutDomain || null,
        business_type: data.businessType,
        pixel_meta_id: data.pixelMeta || null,
        pixel_google_id: data.pixelGoogle || null,
        pixel_tiktok_id: data.pixelTiktok || null,
        events_config: {
          lead: data.events.lead,
          purchase: data.events.purchase,
          initiate_checkout: data.events.initiateCheckout,
          add_to_cart: data.events.addToCart,
          view_content: data.events.viewContent,
          custom_events: customEvents,
        },
        destinations: {
          meta_capi: data.capiActive && !!data.pixelMeta,
          google_ads: !!data.pixelGoogle,
          tiktok_events: !!data.pixelTiktok,
          webhook_url: data.webhookUrl || undefined,
        },
        capi_token_encrypted: data.capiActive ? data.capiToken || null : null,
        setup_completed: true,
        onboarding_step: 4,
      };

      const ws = await createWorkspace(insert);
      setWorkspaces([ws, ...workspaces]);
      setCurrentWorkspace(ws);
      setOnboardingStep(4);
      setCurrentModule('cmd-overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar workspace');
    } finally {
      setLoading(false);
    }
  };

  const validationItems = [
    { label: 'Pixel Meta', ok: !!data.pixelMeta },
    { label: 'Pixel Google', ok: !!data.pixelGoogle },
    { label: 'Pixel TikTok', ok: !!data.pixelTiktok },
    { label: 'Webhook', ok: !!data.webhookUrl },
    { label: 'CAPI Server-side', ok: data.capiActive && !!data.capiToken },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0c0c14', padding: isMobile ? 16 : 32,
      overflow: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <motion.h1
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{
            fontFamily: 'Space Grotesk', fontSize: isMobile ? 22 : 28,
            fontWeight: 700, color: '#e2e8f0', textAlign: 'center', marginBottom: 8,
          }}
        >
          Configurar Workspace
        </motion.h1>
        <p style={{
          fontFamily: 'Outfit', fontSize: 14, color: '#64748b',
          textAlign: 'center', marginBottom: 24,
        }}>
          {STEP_LABELS[step]} — Passo {step + 1} de 3
        </p>

        <StepIndicator current={step} />

        <AlpineCard padding={isMobile ? 20 : 32}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, color: '#e2e8f0', marginBottom: 20 }}>
                  Qual e o seu projeto?
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Nome do projeto *</label>
                    <input style={inputStyle} placeholder="Meu Produto Digital" value={data.name} onChange={(e) => update('name', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Dominio *</label>
                    <input style={inputStyle} placeholder="meusite.com.br" value={data.domain} onChange={(e) => update('domain', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Dominio do checkout (opcional)</label>
                    <input style={inputStyle} placeholder="pay.kiwify.com.br" value={data.checkoutDomain} onChange={(e) => update('checkoutDomain', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Tipo de negocio</label>
                    <select
                      style={{ ...inputStyle, appearance: 'none' }}
                      value={data.businessType}
                      onChange={(e) => update('businessType', e.target.value as BusinessType)}
                    >
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt.value} value={bt.value} style={{ background: '#1a1a2e' }}>{bt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, color: '#e2e8f0', marginBottom: 20 }}>
                  O que voce quer rastrear?
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {([
                    { key: 'pageView' as const, label: 'PageView', desc: 'Visualizacao de pagina (sempre ativo)', disabled: true },
                    { key: 'viewContent' as const, label: 'ViewContent', desc: 'Visualizacao de conteudo do produto' },
                    { key: 'lead' as const, label: 'Lead', desc: 'Captura de lead / formulario' },
                    { key: 'initiateCheckout' as const, label: 'InitiateCheckout', desc: 'Inicio de checkout' },
                    { key: 'purchase' as const, label: 'Purchase', desc: 'Compra confirmada' },
                    { key: 'addToCart' as const, label: 'AddToCart', desc: 'Produto adicionado ao carrinho' },
                  ]).map((ev) => (
                    <div key={ev.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#e2e8f0' }}>{ev.label}</span>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{ev.desc}</p>
                      </div>
                      <Toggle
                        checked={ev.key === 'pageView' ? true : data.events[ev.key]}
                        onChange={(v) => update('events', { ...data.events, [ev.key]: v })}
                        disabled={ev.disabled}
                      />
                    </div>
                  ))}
                </div>

                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, color: '#8b5cf6', marginTop: 24, marginBottom: 12 }}>
                  Eventos Sinteticos
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {([
                    { key: 'deepEngagement' as const, label: 'DeepEngagement', desc: 'Scroll >70% + tempo >60s na pagina' },
                    { key: 'highIntentVisitor' as const, label: 'HighIntentVisitor', desc: 'Visitou checkout ou pricing 2+ vezes' },
                    { key: 'qualifiedLead' as const, label: 'QualifiedLead', desc: 'Lead + engajamento alto = qualificado' },
                  ]).map((ev) => (
                    <div key={ev.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#c4b5fd' }}>{ev.label}</span>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{ev.desc}</p>
                      </div>
                      <Toggle
                        checked={data.syntheticEvents[ev.key]}
                        onChange={(v) => update('syntheticEvents', { ...data.syntheticEvents, [ev.key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, color: '#e2e8f0', marginBottom: 20 }}>
                  Para onde enviar os dados?
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Pixel ID do Meta (opcional)</label>
                    <input style={inputStyle} placeholder="123456789012345" value={data.pixelMeta} onChange={(e) => update('pixelMeta', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Pixel ID do Google (opcional)</label>
                    <input style={inputStyle} placeholder="AW-123456789" value={data.pixelGoogle} onChange={(e) => update('pixelGoogle', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Pixel ID do TikTok (opcional)</label>
                    <input style={inputStyle} placeholder="ABCDEF123456" value={data.pixelTiktok} onChange={(e) => update('pixelTiktok', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Webhook URL (opcional)</label>
                    <input style={inputStyle} placeholder="https://hooks.example.com/events" value={data.webhookUrl} onChange={(e) => update('webhookUrl', e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                    <div>
                      <span style={{ fontFamily: 'Outfit', fontSize: 14, color: '#e2e8f0' }}>CAPI (server-side) ativo</span>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Envia eventos via Conversions API</p>
                    </div>
                    <Toggle checked={data.capiActive} onChange={(v) => update('capiActive', v)} />
                  </div>
                  {data.capiActive && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label style={labelStyle}>CAPI Token</label>
                      <input style={inputStyle} type="password" placeholder="EAAx..." value={data.capiToken} onChange={(e) => update('capiToken', e.target.value)} />
                    </motion.div>
                  )}
                </div>

                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, color: '#8b5cf6', marginTop: 24, marginBottom: 12 }}>
                  Validacao
                </h3>
                <div style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                  padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {validationItems.map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: item.ok ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                      }}>
                        {item.ok ? <Check size={12} color="#4ade80" /> : <X size={12} color="#f87171" />}
                      </div>
                      <span style={{ fontFamily: 'Outfit', fontSize: 13, color: item.ok ? '#4ade80' : '#64748b' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {error && (
                  <p style={{ color: '#f87171', fontSize: 13, marginTop: 12, fontFamily: 'Outfit' }}>{error}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{
            display: 'flex', justifyContent: step === 0 ? 'flex-end' : 'space-between',
            marginTop: 28, gap: 12,
          }}>
            {step > 0 && (
              <button style={btnOutline} onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft size={16} /> Voltar
              </button>
            )}
            {step < 2 ? (
              <button
                style={{ ...btnPrimary, opacity: canNext ? 1 : 0.5, pointerEvents: canNext ? 'auto' : 'none' }}
                onClick={() => setStep((s) => s + 1)}
              >
                Proximo <ArrowRight size={16} />
              </button>
            ) : (
              <button
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Criando...' : 'Criar Workspace'} <Check size={16} />
              </button>
            )}
          </div>
        </AlpineCard>
      </div>
    </div>
  );
}
