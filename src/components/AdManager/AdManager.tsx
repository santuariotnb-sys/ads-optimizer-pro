import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight, ChevronLeft, Check, Shield, Brain,
  Megaphone, Users, Image, Sparkles, AlertTriangle,
  CheckCircle, Mountain,
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useStore } from '../../store/useStore';
import { MetaApiService } from '../../services/metaApi';
import {
  runSafetyChecks, createFullCampaign, buildAISuggestionContext,
  type AdManagerCampaignForm, type AdManagerAdSetForm, type AdManagerAdForm,
  type SafetyCheckResult, type CreationResult,
} from '../../services/adManagerService';
import { evaluateAlerts } from '../../services/alertEngine';
import CampaignStep from './CampaignStep';
import AdSetStep from './AdSetStep';
import AdStep from './AdStep';
import ReviewPanel from './ReviewPanel';

// ─── Styles ─────────────────────────────────────────────────────────────

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,.34)',
  backdropFilter: 'blur(28px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,.55)',
  borderRadius: 20,
  padding: 32,
  boxShadow: '0 30px 120px -45px rgba(15,23,42,.26), inset 0 1px 0 rgba(255,255,255,.92)',
};

const stepLabels = ['Campanha', 'Conjunto', 'Anúncio', 'Revisão'];
const stepIcons = [Megaphone, Users, Image, Shield];

// ─── Default Forms ──────────────────────────────────────────────────────

const defaultCampaignForm: AdManagerCampaignForm = {
  name: '',
  objective: 'OUTCOME_SALES',
  bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
  budgetType: 'daily',
  budget: 0,
  specialCategories: ['Nenhuma'],
};

const defaultAdSetForm: AdManagerAdSetForm = {
  name: '',
  campaignId: '',
  optimizationGoal: 'OFFSITE_CONVERSIONS',
  conversionLocation: 'WEBSITE',
  pixelId: '',
  conversionEvent: 'Purchase',
  attributionWindow: '7d_click_1d_view',
  performanceGoal: '',
  budgetType: 'daily',
  budget: 0,
  scheduleStart: '',
  scheduleEnd: '',
  targeting: {
    type: 'advantage_plus',
    countries: ['Brasil'],
    ageMin: 18,
    ageMax: 65,
    genders: [0],
    customAudiences: [],
    excludedAudiences: [],
  },
  placements: 'advantage',
};

const defaultAdForm: AdManagerAdForm = {
  name: '',
  adSetId: '',
  pageId: '',
  instagramAccountId: '',
  creativeType: 'new',
  existingPostId: '',
  format: 'image',
  media: null,
  primaryText: '',
  headline: '',
  description: '',
  ctaType: 'LEARN_MORE',
  destinationUrl: '',
  displayUrl: '',
  utmSource: 'facebook',
  utmMedium: 'cpc',
  utmCampaign: '',
  utmContent: '',
  utmTerm: '',
  trackingPixelId: '',
};

// ─── Component ──────────────────────────────────────────────────────────

export default function AdManager() {
  const isMobile = useIsMobile();
  const mode = useStore((s) => s.mode);
  const accessToken = useStore((s) => s.accessToken);
  const adAccountId = useStore((s) => s.adAccountId);
  const campaigns = useStore((s) => s.campaigns);
  const creatives = useStore((s) => s.creatives);
  const audiences = useStore((s) => s.audiences);
  const emqScore = useStore((s) => s.emqScore);
  const setAlerts = useStore((s) => s.setAlerts);
  const setCurrentModule = useStore((s) => s.setCurrentModule);
  const currentWorkspace = useStore((s) => s.currentWorkspace);

  // Step state
  const [step, setStep] = useState(0);
  const [campaignForm, setCampaignForm] = useState<AdManagerCampaignForm>({ ...defaultCampaignForm });
  const [adSetForm, setAdSetForm] = useState<AdManagerAdSetForm>({ ...defaultAdSetForm });
  const [adForm, setAdForm] = useState<AdManagerAdForm>({ ...defaultAdForm });

  // Creation mode toggles
  const [campaignMode, setCampaignMode] = useState<'new' | 'existing'>('new');
  const [adSetMode, setAdSetMode] = useState<'new' | 'existing'>('new');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedAdSetId, setSelectedAdSetId] = useState('');

  // API data
  const [existingCampaigns, setExistingCampaigns] = useState<{ id: string; name: string; status: string; objective: string }[]>([]);
  const [existingAdSets, setExistingAdSets] = useState<{ id: string; name: string; status: string; daily_budget: string }[]>([]);
  const [pages, setPages] = useState<{ id: string; name: string; picture: string }[]>([]);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreationResult | null>(null);
  const [safetyChecks, setSafetyChecks] = useState<SafetyCheckResult[]>([]);

  // AI insights panel
  const [showAI, setShowAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  // ─── Fetch existing data ───────────────────────────────────────────

  useEffect(() => {
    if (mode !== 'live' || !accessToken || !adAccountId) return;
    const api = new MetaApiService(accessToken, adAccountId);

    api.fetchCampaignsList().then(res => {
      if (res.data) setExistingCampaigns(res.data);
    }).catch(() => {});

    api.fetchPagesWithPicture().then(res => {
      if (res.data?.length) {
        setPages(res.data.map(p => ({
          id: p.id,
          name: p.name,
          picture: p.picture?.data?.url || '',
        })));
        if (res.data.length === 1) {
          setAdForm(prev => ({ ...prev, pageId: res.data[0].id }));
        }
      }
    }).catch(() => {});
  }, [mode, accessToken, adAccountId]);

  // Fetch ad sets when campaign selected
  useEffect(() => {
    if (!accessToken || !adAccountId || !selectedCampaignId) return;
    const api = new MetaApiService(accessToken, adAccountId);
    api.fetchAdSetsList(selectedCampaignId).then(res => {
      if (res.data) setExistingAdSets(res.data);
    }).catch(() => {});
  }, [accessToken, adAccountId, selectedCampaignId]);

  // Auto-fill pixel from workspace
  useEffect(() => {
    if (currentWorkspace?.pixel_meta_id) {
      setAdSetForm(prev => ({ ...prev, pixelId: currentWorkspace.pixel_meta_id || '' }));
      setAdForm(prev => ({ ...prev, trackingPixelId: currentWorkspace.pixel_meta_id || '' }));
    }
  }, [currentWorkspace]);

  // ─── Safety checks on step 3 ──────────────────────────────────────

  useEffect(() => {
    if (step === 3) {
      const checks = runSafetyChecks(campaignForm, adSetForm, adForm, campaigns, creatives);
      setSafetyChecks(checks);
    }
  }, [step, campaignForm, adSetForm, adForm, campaigns, creatives]);

  // ─── Handlers ─────────────────────────────────────────────────────

  const updateCampaignForm = useCallback((key: string, value: unknown) => {
    setCampaignForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateAdSetForm = useCallback((key: string, value: unknown) => {
    setAdSetForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateAdSetTargeting = useCallback((key: string, value: unknown) => {
    setAdSetForm(prev => ({
      ...prev,
      targeting: { ...prev.targeting, [key]: value },
    }));
  }, []);

  const updateAdForm = useCallback((key: string, value: unknown) => {
    setAdForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const canAdvance = useCallback((): boolean => {
    switch (step) {
      case 0:
        if (campaignMode === 'existing') return !!selectedCampaignId;
        return !!campaignForm.name.trim() && campaignForm.budget > 0;
      case 1:
        if (adSetMode === 'existing') return !!selectedAdSetId;
        return !!adSetForm.name.trim() && adSetForm.budget > 0;
      case 2:
        return true; // Ad is optional
      case 3:
        return !safetyChecks.some(c => c.status === 'fail');
      default:
        return false;
    }
  }, [step, campaignMode, adSetMode, selectedCampaignId, selectedAdSetId, campaignForm, adSetForm, safetyChecks]);

  const handleNext = () => {
    if (step < 3 && canAdvance()) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!accessToken || !adAccountId) {
      setResult({ success: false, error: 'Sem acesso à API. Conecte sua conta Meta.', warnings: [] });
      return;
    }

    setIsSubmitting(true);
    const api = new MetaApiService(accessToken, adAccountId);

    const creationResult = await createFullCampaign(
      api,
      campaignForm,
      adSetForm,
      adForm,
      campaignMode === 'existing' ? selectedCampaignId : undefined,
      adSetMode === 'existing' ? selectedAdSetId : undefined,
    );

    setResult(creationResult);
    setIsSubmitting(false);

    // Post-creation: re-evaluate alerts
    if (creationResult.success) {
      const updatedAlerts = evaluateAlerts(campaigns, emqScore);
      setAlerts(updatedAlerts);
    }
  };

  const handleReset = () => {
    setStep(0);
    setCampaignForm({ ...defaultCampaignForm });
    setAdSetForm({ ...defaultAdSetForm });
    setAdForm({ ...defaultAdForm });
    setCampaignMode('new');
    setAdSetMode('new');
    setSelectedCampaignId('');
    setSelectedAdSetId('');
    setResult(null);
    setSafetyChecks([]);
  };

  const handleRequestAI = () => {
    const context = buildAISuggestionContext(campaignForm, adSetForm, audiences, campaigns);
    setAiSuggestion(context);
    setShowAI(true);
  };

  // ─── Step Indicator ───────────────────────────────────────────────

  const renderStepIndicator = () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: isMobile ? 24 : 40,
    }}>
      {stepLabels.map((label, i) => {
        const isCompleted = i < step;
        const isActive = i === step;
        const Icon = stepIcons[i];
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: isMobile ? 4 : 8,
            }}>
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  boxShadow: isActive
                    ? '0 0 24px rgba(99,102,241,0.35)'
                    : isCompleted
                    ? '0 0 12px rgba(74,222,128,0.3)'
                    : 'none',
                }}
                transition={{ duration: 0.3 }}
                style={{
                  width: isMobile ? 36 : 44,
                  height: isMobile ? 36 : 44,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCompleted
                    ? 'linear-gradient(135deg, #10b981, #34d399)'
                    : isActive
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(15,23,42,0.06)',
                  color: isCompleted || isActive ? '#fff' : '#94a3b8',
                  cursor: i < step ? 'pointer' : 'default',
                  transition: 'background 0.3s',
                }}
                onClick={() => { if (i < step) setStep(i); }}
              >
                {isCompleted ? <Check size={18} /> : <Icon size={18} />}
              </motion.div>
              <span style={{
                fontSize: 11, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#0f172a' : '#94a3b8',
                whiteSpace: 'nowrap',
                letterSpacing: '0.3px',
              }}>
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div style={{
                width: isMobile ? 32 : 72, height: 2,
                background: i < step
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'rgba(15,23,42,0.08)',
                margin: '0 8px', marginBottom: 24,
                borderRadius: 1, transition: 'background 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ─── Success Screen ───────────────────────────────────────────────

  if (result) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? 16 : 0 }}>
        <div style={{
          ...glassCard,
          textAlign: 'center',
          padding: isMobile ? 32 : 48,
        }}>
          {result.success ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
                style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 0 40px rgba(16,185,129,0.3)',
                }}
              >
                <CheckCircle size={40} color="#fff" />
              </motion.div>
              <h2 style={{
                fontSize: 24, fontWeight: 800, color: '#0f172a',
                fontFamily: 'Outfit, sans-serif', marginBottom: 8,
              }}>
                Campanha Criada com Sucesso
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
                Todos os elementos foram criados como <strong>PAUSADOS</strong>.
                {result.warnings.length > 0 && (
                  <span style={{ display: 'block', marginTop: 8, color: '#f59e0b' }}>
                    {result.warnings.join(' ')}
                  </span>
                )}
              </p>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                background: 'rgba(15,23,42,0.03)', borderRadius: 12, padding: 16,
                marginBottom: 24, textAlign: 'left',
              }}>
                {result.campaignId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#94a3b8' }}>Campaign ID</span>
                    <span style={{ color: '#0f172a', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                      {result.campaignId}
                    </span>
                  </div>
                )}
                {result.adSetId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#94a3b8' }}>Ad Set ID</span>
                    <span style={{ color: '#0f172a', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                      {result.adSetId}
                    </span>
                  </div>
                )}
                {result.adId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#94a3b8' }}>Ad ID</span>
                    <span style={{ color: '#0f172a', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                      {result.adId}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(15,23,42,0.1)',
                    background: '#fff', color: '#0f172a', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Criar Outra
                </button>
                <button
                  onClick={() => setCurrentModule('cmd-campaigns')}
                  style={{
                    padding: '12px 24px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Ver Campanhas
                </button>
              </div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ef4444, #f87171)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 0 40px rgba(239,68,68,0.3)',
                }}
              >
                <AlertTriangle size={40} color="#fff" />
              </motion.div>
              <h2 style={{
                fontSize: 24, fontWeight: 800, color: '#0f172a',
                fontFamily: 'Outfit, sans-serif', marginBottom: 8,
              }}>
                Erro na Criação
              </h2>
              <p style={{
                fontSize: 14, color: '#ef4444', marginBottom: 24,
                background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: 16,
              }}>
                {result.error}
              </p>
              <button
                onClick={() => { setResult(null); setStep(3); }}
                style={{
                  padding: '12px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Tentar Novamente
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: isMobile ? 20 : 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mountain size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{
              fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#0f172a',
              fontFamily: 'Outfit, sans-serif', margin: 0, lineHeight: 1.2,
            }}>
              Gerenciador de Anúncios
            </h1>
            <p style={{
              fontSize: 13, color: '#94a3b8', margin: 0,
              fontFamily: 'Outfit, sans-serif',
            }}>
              Crie campanhas completas com segurança
            </p>
          </div>
        </div>

        {!isMobile && (
          <button
            onClick={handleRequestAI}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#6366f1', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.background = 'rgba(99,102,241,0.15)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.background = 'rgba(99,102,241,0.08)';
            }}
          >
            <Brain size={16} />
            Sugestão IA
          </button>
        )}
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* AI Panel (collapsible) */}
      <AnimatePresence>
        {showAI && aiSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 24 }}
          >
            <div style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 16, padding: 20,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="#6366f1" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>
                    Contexto para Apex (Agente IA)
                  </span>
                </div>
                <button
                  onClick={() => setShowAI(false)}
                  style={{
                    background: 'none', border: 'none', color: '#94a3b8',
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Fechar
                </button>
              </div>
              <p style={{
                fontSize: 12, color: '#64748b', lineHeight: 1.6,
                fontFamily: 'JetBrains Mono, monospace',
                whiteSpace: 'pre-wrap',
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 10, padding: 16,
                margin: 0,
              }}>
                {aiSuggestion}
              </p>
              <button
                onClick={() => {
                  setShowAI(false);
                  setCurrentModule('cmd-apex');
                }}
                style={{
                  marginTop: 12, padding: '8px 16px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', border: 'none', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Abrir Apex com Contexto
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Content */}
      <div style={{ ...glassCard, padding: isMobile ? 20 : 32 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <CampaignStep
                form={campaignForm}
                onChange={updateCampaignForm}
                mode={mode}
                existingCampaigns={existingCampaigns}
                selectedCampaignId={selectedCampaignId}
                onSelectCampaign={setSelectedCampaignId}
                creationMode={campaignMode}
                onCreationModeChange={setCampaignMode}
              />
            )}
            {step === 1 && (
              <AdSetStep
                form={adSetForm}
                onChange={updateAdSetForm}
                onTargetingChange={updateAdSetTargeting}
                audiences={audiences}
                mode={mode}
                existingAdSets={existingAdSets}
                selectedAdSetId={selectedAdSetId}
                onSelectAdSet={setSelectedAdSetId}
                creationMode={adSetMode}
                onCreationModeChange={setAdSetMode}
                campaignObjective={campaignForm.objective}
              />
            )}
            {step === 2 && (
              <AdStep
                form={adForm}
                onChange={updateAdForm}
                pages={pages}
                mode={mode}
              />
            )}
            {step === 3 && (
              <ReviewPanel
                campaignSummary={{
                  name: campaignMode === 'existing'
                    ? existingCampaigns.find(c => c.id === selectedCampaignId)?.name || selectedCampaignId
                    : campaignForm.name,
                  objective: campaignForm.objective,
                  budget: campaignForm.budget,
                  budgetType: campaignForm.budgetType,
                }}
                adSetSummary={{
                  name: adSetMode === 'existing'
                    ? existingAdSets.find(a => a.id === selectedAdSetId)?.name || selectedAdSetId
                    : adSetForm.name,
                  optimizationGoal: adSetForm.optimizationGoal,
                  budget: adSetForm.budget,
                  countries: adSetForm.targeting.countries,
                  ageRange: `${adSetForm.targeting.ageMin}-${adSetForm.targeting.ageMax}`,
                  placements: adSetForm.placements === 'advantage' ? 'Advantage+' : 'Manual',
                }}
                adSummary={{
                  name: adForm.name,
                  format: adForm.format,
                  hasMedia: !!adForm.media,
                  hasUrl: !!adForm.destinationUrl,
                  hasTracking: !!(adForm.trackingPixelId || adForm.utmSource),
                  ctaType: adForm.ctaType,
                }}
                safetyChecks={safetyChecks}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onBack={handleBack}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons (not on review step — ReviewPanel has its own) */}
      {step < 3 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 24,
        }}>
          <button
            onClick={handleBack}
            disabled={step === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 12,
              background: step === 0 ? 'transparent' : 'rgba(15,23,42,0.04)',
              border: '1px solid rgba(15,23,42,0.08)',
              color: step === 0 ? '#cbd5e1' : '#0f172a',
              fontSize: 14, fontWeight: 600, cursor: step === 0 ? 'default' : 'pointer',
              opacity: step === 0 ? 0.4 : 1,
              transition: 'all 0.2s',
            }}
          >
            <ChevronLeft size={16} />
            Voltar
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 12 }}>
            Etapa {step + 1} de {stepLabels.length}
          </div>

          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 12,
              background: canAdvance()
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(15,23,42,0.06)',
              border: 'none',
              color: canAdvance() ? '#fff' : '#94a3b8',
              fontSize: 14, fontWeight: 600,
              cursor: canAdvance() ? 'pointer' : 'default',
              boxShadow: canAdvance() ? '0 4px 20px rgba(99,102,241,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {step === 2 ? 'Revisar' : 'Próximo'}
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Demo mode hint */}
      {mode === 'demo' && (
        <div style={{
          marginTop: 20, padding: '12px 16px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 12, textAlign: 'center',
        }}>
          <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>
            Modo demonstração — Conecte sua conta Meta para criar campanhas reais.
          </p>
        </div>
      )}
    </div>
  );
}
