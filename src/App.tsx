import { useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from './store/useStore';
import { useIsMobile } from './hooks/useMediaQuery';
import AppLayout from './components/Layout/AppLayout';
import SubNav from './components/Layout/SubNav';
import { DashboardSkeleton } from './components/LoadingSkeleton';

// Modules — lazy loaded for code splitting
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const Overview = lazy(() => import('./components/Overview/Overview'));
const Campaigns = lazy(() => import('./components/Campaigns/Campaigns'));
const Creatives = lazy(() => import('./components/Creatives/Creatives'));
const SignalEngine = lazy(() => import('./components/SignalEngine/SignalEngine'));
const Audiences = lazy(() => import('./components/Audiences/Audiences'));
const Alerts = lazy(() => import('./components/Alerts/Alerts'));
const Agent = lazy(() => import('./components/Agent/Agent'));
const Pipeline = lazy(() => import('./components/Pipeline/Pipeline'));
const CampaignCreator = lazy(() => import('./components/CampaignCreator/CampaignCreator'));
const AutoScale = lazy(() => import('./components/AutoScale/AutoScale'));
const Playbook = lazy(() => import('./components/Playbook/Playbook'));
const Financial = lazy(() => import('./components/Financial/Financial'));
const UTMTracking = lazy(() => import('./components/UTMTracking/UTMTracking'));
const Settings = lazy(() => import('./components/Settings/Settings'));
const Integrations = lazy(() => import('./components/Integrations/Integrations'));
const CreativeVision = lazy(() => import('./components/CreativeVision/CreativeVision'));
const PlatformAds = lazy(() => import('./components/PlatformAds/PlatformAds'));
const SignalGateway = lazy(() => import('./components/SignalGateway/SignalGateway'));
const SignalAudit = lazy(() => import('./components/SignalAudit/SignalAudit'));
const TraceSummary = lazy(() => import('./components/TraceSummary/TraceSummary'));
const OnboardingWizard = lazy(() => import('./components/Onboarding/OnboardingWizard'));

import { parseCallbackToken } from './services/metaAuth';
import { MetaApiService } from './services/metaApi';
import { evaluateAlerts } from './services/alertEngine';
import {
  mockCampaigns, mockAdSetsData, mockAdsData, mockCreativesData,
  mockAudiences, mockAlerts, mockDashboardMetrics, mockEMQ, mockSignalAudit,
} from './data/mockData';

import {
  LayoutDashboard, Megaphone, Radio, DollarSign, Settings as SettingsIcon,
  BarChart3, Link2, ShoppingCart, Globe, Plug, Sparkles, Eye,
  Users, Bell, Bot, GitBranch, Zap, Shield, Satellite,
} from 'lucide-react';

// Sub-nav definitions for each main tab
const comandoNav = [
  { id: 'cmd-overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'cmd-campaigns', label: 'Campanhas', icon: Megaphone },
  { id: 'cmd-orbit', label: 'Orbit Engine', icon: Zap },
  { id: 'cmd-audiences', label: 'Públicos', icon: Users },
  { id: 'cmd-alerts', label: 'Alertas', icon: Bell },
  { id: 'cmd-apex', label: 'Apex', icon: Bot },
  { id: 'cmd-flow', label: 'Flow Builder', icon: GitBranch },
  { id: 'cmd-financial', label: 'Financeiro', icon: DollarSign },
  { id: 'cmd-settings', label: 'Configurações', icon: SettingsIcon },
];

const traceNav = [
  { id: 'trace-dashboard', label: 'Resumo', icon: LayoutDashboard },
  { id: 'trace-utms', label: 'UTMs', icon: Link2 },
  { id: 'trace-vendas', label: 'Vendas', icon: ShoppingCart },
  { id: 'trace-reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'trace-events', label: 'Eventos', icon: Radio },
  { id: 'trace-pulse', label: 'Pulse Router', icon: Satellite },
  { id: 'trace-funnel', label: 'Funil', icon: Shield },
  { id: 'meta-campanhas', label: 'Facebook', icon: Globe },
  { id: 'google-campanhas', label: 'Google', icon: Globe },
  { id: 'tiktok-campanhas', label: 'TikTok', icon: Globe },
  { id: 'kwai-campanhas', label: 'Kwai', icon: Globe },
  { id: 'integ-dashboard', label: 'Integrações', icon: Plug },
];

const creativeNav = [
  { id: 'cre-dashboard', label: 'Criativos', icon: Sparkles },
  { id: 'cre-vision', label: 'Análise IA', icon: Eye },
];

type TabId = 'cmd' | 'trace' | 'cre';

function getActiveTab(module: string): TabId {
  if (module.startsWith('trace-') || module.startsWith('utm-') || module.startsWith('meta-') || module.startsWith('google-') || module.startsWith('tiktok-') || module.startsWith('kwai-') || module.startsWith('integ-')) return 'trace';
  if (module.startsWith('cre-')) return 'cre';
  if (module.startsWith('opt-')) return 'cmd'; // backward compat
  return 'cmd';
}

function getSubNavItems(tab: TabId) {
  switch (tab) {
    case 'trace': return traceNav;
    case 'cre': return creativeNav;
    default: return comandoNav;
  }
}

function ModuleRouter() {
  const currentModule = useStore((s) => s.currentModule);
  const isLoading = useStore((s) => s.isLoading);

  if (isLoading) return <DashboardSkeleton />;

  switch (currentModule) {
    // COMANDO tab
    case 'cmd-overview':
    case 'opt-overview': // backward compat
      return <Overview />;
    case 'dashboard':
      return <Dashboard />;
    case 'cmd-campaigns':
    case 'opt-campaigns': // backward compat
    case 'campaigns':
      return <Campaigns />;
    case 'cmd-orbit':
    case 'opt-scale': // backward compat
    case 'autoscale':
      return <AutoScale />;
    case 'cmd-audiences':
    case 'opt-audiences': // backward compat
    case 'audiences':
      return <Audiences />;
    case 'cmd-alerts':
    case 'opt-alerts': // backward compat
    case 'alerts':
      return <Alerts />;
    case 'cmd-apex':
    case 'opt-agent': // backward compat
    case 'agent':
      return <Agent />;
    case 'cmd-flow':
    case 'opt-pipeline': // backward compat
    case 'pipeline':
      return <Pipeline />;
    case 'cmd-financial':
    case 'opt-financial': // backward compat
    case 'financial':
      return <Financial />;
    case 'cmd-settings':
    case 'opt-settings': // backward compat
    case 'settings':
      return <Settings />;

    // XTRACKER tab — Resumo (summary dashboard)
    case 'trace-dashboard':
      return <TraceSummary />;
    // backward compat routes → UTMTracking
    case 'utm-campanhas':
    case 'utm-dashboard':
    case 'utm':
      return <UTMTracking />;
    case 'trace-utms':
    case 'utm-utms': // backward compat
    case 'utm-sources':
    case 'utm-links':
      return <UTMTracking />;
    case 'trace-vendas':
    case 'utm-vendas': // backward compat
    case 'utm-sales':
      return <UTMTracking />;
    case 'trace-reports':
    case 'utm-relatorios': // backward compat
    case 'utm-webhooks':
      return <UTMTracking />;
    case 'trace-events':
    case 'opt-signal': // backward compat
    case 'signal':
      return <SignalEngine />;
    case 'trace-pulse':
    case 'opt-gateway': // backward compat
    case 'gateway':
      return <SignalGateway />;
    case 'trace-funnel':
    case 'opt-audit': // backward compat
    case 'signalaudit':
      return <SignalAudit />;
    case 'utm-despesas':
      return <Financial />;

    // Creative tab
    case 'cre-dashboard':
    case 'cre-analysis':
    case 'cre-compare':
    case 'cre-upload':
    case 'creatives':
      return <Creatives />;
    case 'cre-entity':
      return <Creatives />;
    case 'cre-vision':
      return <CreativeVision />;

    // Facebook (Meta) Ads
    case 'meta-contas':
    case 'meta-campanhas':
    case 'meta-conjuntos':
    case 'meta-anuncios':
      return <PlatformAds platform="meta" />;

    // Google Ads
    case 'google-contas':
    case 'google-campanhas':
    case 'google-conjuntos':
    case 'google-anuncios':
      return <PlatformAds platform="google" />;

    // TikTok Ads
    case 'tiktok-contas':
    case 'tiktok-campanhas':
    case 'tiktok-conjuntos':
    case 'tiktok-anuncios':
      return <PlatformAds platform="tiktok" />;

    // Kwai Ads
    case 'kwai-contas':
    case 'kwai-campanhas':
    case 'kwai-conjuntos':
    case 'kwai-anuncios':
      return <PlatformAds platform="kwai" />;

    // Integrações
    case 'integ-dashboard':
    case 'integ-webhooks':
    case 'integ-utms':
    case 'integ-pixel':
    case 'integ-whatsapp':
    case 'integ-testes':
      return <Integrations />;

    // Legacy optimizer sub-modules
    case 'opt-playbook': // backward compat (removed from nav but still routable)
    case 'playbook':
      return <Playbook />;
    case 'create':
      return <CampaignCreator />;

    default:
      return <Overview />;
  }
}

export default function App() {
  const isMobile = useIsMobile();
  const setCampaigns = useStore((s) => s.setCampaigns);
  const setAdSets = useStore((s) => s.setAdSets);
  const setAds = useStore((s) => s.setAds);
  const setCreatives = useStore((s) => s.setCreatives);
  const setAudiences = useStore((s) => s.setAudiences);
  const setAlerts = useStore((s) => s.setAlerts);
  const setMetrics = useStore((s) => s.setMetrics);
  const setEMQScore = useStore((s) => s.setEMQScore);
  const setSignalAudit = useStore((s) => s.setSignalAudit);
  const setIsLoading = useStore((s) => s.setIsLoading);
  const setAccessToken = useStore((s) => s.setAccessToken);
  const setCurrentModule = useStore((s) => s.setCurrentModule);
  const mode = useStore((s) => s.mode);
  const accessToken = useStore((s) => s.accessToken);
  const adAccountId = useStore((s) => s.adAccountId);
  const currentModule = useStore((s) => s.currentModule);

  // Set default module on first load
  useEffect(() => {
    if (currentModule === 'dashboard') {
      setCurrentModule('cmd-overview');
    }
  }, [currentModule, setCurrentModule]);

  useEffect(() => {
    if (mode === 'demo') {
      setCampaigns(mockCampaigns);
      setAdSets(mockAdSetsData);
      setAds(mockAdsData);
      setCreatives(mockCreativesData);
      setAudiences(mockAudiences);
      const dynamicAlerts = evaluateAlerts(mockCampaigns, mockEMQ.total);
      setAlerts([...mockAlerts, ...dynamicAlerts]);
      setMetrics(mockDashboardMetrics);
      setEMQScore(mockEMQ.total);
      setSignalAudit(mockSignalAudit);
    }
  }, [mode, setCampaigns, setAdSets, setAds, setCreatives, setAudiences, setAlerts, setMetrics, setEMQScore, setSignalAudit]);

  useEffect(() => {
    const token = parseCallbackToken();
    if (token) {
      setAccessToken(token);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [setAccessToken]);

  useEffect(() => {
    if (mode !== 'live' || !accessToken || !adAccountId) return;

    const api = new MetaApiService(accessToken, adAccountId);

    async function fetchLiveData() {
      setIsLoading(true);
      try {
        const [campaignsRes, audiencesRes] = await Promise.all([
          api.fetchCampaigns(),
          api.fetchAudiences(),
        ]) as [Record<string, unknown>, Record<string, unknown>];

        if (campaignsRes?.data) {
          interface MetaCampaign { id: string; name: string; status?: string; objective?: string; daily_budget?: number; lifetime_budget?: number; created_time?: string }
          const campaigns = (campaignsRes.data as MetaCampaign[]).map((c) => ({
            id: c.id,
            name: c.name,
            status: (c.status || 'ACTIVE') as import('./types/meta').CampaignStatus,
            objective: c.objective || '',
            daily_budget: (c.daily_budget || 0) / 100,
            lifetime_budget: (c.lifetime_budget || 0) / 100,
            roas: 0, cpa: 0, ctr: 0, cpm: 0,
            spend: 0, conversions: 0, impressions: 0, clicks: 0,
            frequency: 0, opportunity_score: 50,
            created_time: c.created_time || new Date().toISOString(),
          }));
          setCampaigns(campaigns);

          for (const campaign of campaigns) {
            try {
              const insights = await api.fetchInsights(
                campaign.id,
                'spend,impressions,clicks,cpc,cpm,ctr,actions,action_values',
                'last_7d'
              ) as Record<string, unknown>;
              if (insights?.data) {
                const d = (insights.data as Record<string, unknown>[])[0];
                const actions = (d?.actions || []) as Record<string, unknown>[];
                const actionValues = (d?.action_values || []) as Record<string, unknown>[];
                const conversions = String(actions.find((a) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || '0');
                const revenue = String(actionValues.find((a) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || '0');
                const spend = parseFloat(String(d.spend || '0'));
                const convCount = parseInt(conversions);
                Object.assign(campaign, {
                  spend,
                  impressions: parseInt(String(d.impressions || '0')),
                  clicks: parseInt(String(d.clicks || '0')),
                  ctr: parseFloat(String(d.ctr || '0')),
                  cpm: parseFloat(String(d.cpm || '0')),
                  conversions: convCount,
                  cpa: convCount > 0 ? spend / convCount : 0,
                  roas: spend > 0 ? parseFloat(revenue) / spend : 0,
                });
              }
            } catch {
              // Skip failed individual fetches
            }
          }
          setCampaigns([...campaigns]);
        }

        if (audiencesRes?.data) {
          interface MetaAudience { id: string; name: string; approximate_count?: number }
          const audiences = (audiencesRes.data as MetaAudience[]).map((a) => ({
            id: a.id,
            name: a.name,
            size: a.approximate_count || 0,
            cpa: 0, roas: 0, overlap_percent: 0,
            saturation_percent: 0, frequency: 0, status: 'active' as const,
          }));
          setAudiences(audiences);
        }
      } catch (err) {
        console.error('Erro ao buscar dados do Meta:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLiveData();
  }, [mode, accessToken, adAccountId, setCampaigns, setAudiences, setIsLoading]);

  const activeTab = getActiveTab(currentModule);
  const subNavItems = getSubNavItems(activeTab);
  const currentWorkspace = useStore((s) => s.currentWorkspace);
  const showOnboarding = mode === 'live' && !currentWorkspace && currentModule === 'cmd-onboarding';

  return (
    <AppLayout>
      {showOnboarding ? (
        <main style={{ flex: 1, minWidth: 0, padding: isMobile ? 12 : 24, paddingBottom: 100, overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
          <Suspense fallback={<DashboardSkeleton />}>
            <OnboardingWizard />
          </Suspense>
        </main>
      ) : (
        <>
          <SubNav items={subNavItems} />
          <main style={{ flex: 1, minWidth: 0, padding: isMobile ? 12 : 24, paddingBottom: 100, overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentModule}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <Suspense fallback={<DashboardSkeleton />}>
                  <ModuleRouter />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </>
      )}
    </AppLayout>
  );
}
