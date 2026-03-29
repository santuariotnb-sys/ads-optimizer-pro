import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useIsMobile } from './hooks/useMediaQuery';
import AppLayout from './components/Layout/AppLayout';
import SubNav from './components/Layout/SubNav';
import { DashboardSkeleton } from './components/LoadingSkeleton';

// Modules — lazy-ish imports (all sync for now, can React.lazy later)
import Dashboard from './components/Dashboard/Dashboard';
import Overview from './components/Overview/Overview';
import Campaigns from './components/Campaigns/Campaigns';
import Creatives from './components/Creatives/Creatives';
import SignalEngine from './components/SignalEngine/SignalEngine';
import Audiences from './components/Audiences/Audiences';
import Alerts from './components/Alerts/Alerts';
import Agent from './components/Agent/Agent';
import Pipeline from './components/Pipeline/Pipeline';
import CampaignCreator from './components/CampaignCreator/CampaignCreator';
import AutoScale from './components/AutoScale/AutoScale';
import Playbook from './components/Playbook/Playbook';
import Financial from './components/Financial/Financial';
import UTMTracking from './components/UTMTracking/UTMTracking';
import Settings from './components/Settings/Settings';
import CreativeVision from './components/CreativeVision/CreativeVision';

import { parseCallbackToken } from './services/metaAuth';
import { MetaApiService } from './services/metaApi';
import {
  mockCampaigns, mockAdSetsData, mockAdsData, mockCreativesData,
  mockAudiences, mockAlerts, mockDashboardMetrics, mockEMQ, mockSignalAudit,
} from './data/mockData';

import {
  LayoutDashboard, Megaphone, Radio, DollarSign, Settings as SettingsIcon,
  BarChart3, Link2, ShoppingCart,
  Sparkles, Eye,
} from 'lucide-react';

// Sub-nav definitions for each main tab
const optimizerNav = [
  { id: 'opt-overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'opt-campaigns', label: 'Campanhas', icon: Megaphone },
  { id: 'opt-signal', label: 'Rastreamento', icon: Radio },
  { id: 'opt-financial', label: 'Financeiro', icon: DollarSign },
  { id: 'opt-settings', label: 'Configurações', icon: SettingsIcon },
];

const utmNav = [
  { id: 'utm-campanhas', label: 'Campanhas', icon: Megaphone },
  { id: 'utm-utms', label: 'UTMs', icon: Link2 },
  { id: 'utm-vendas', label: 'Vendas', icon: ShoppingCart },
  { id: 'utm-despesas', label: 'Despesas', icon: DollarSign },
  { id: 'utm-relatorios', label: 'Relatórios', icon: BarChart3 },
];

const creativeNav = [
  { id: 'cre-dashboard', label: 'Criativos', icon: Sparkles },
  { id: 'cre-vision', label: 'Análise IA', icon: Eye },
];

function getActiveTab(module: string): 'opt' | 'utm' | 'cre' {
  if (module.startsWith('utm-')) return 'utm';
  if (module.startsWith('cre-')) return 'cre';
  return 'opt';
}

function getSubNavItems(tab: 'opt' | 'utm' | 'cre') {
  switch (tab) {
    case 'utm': return utmNav;
    case 'cre': return creativeNav;
    default: return optimizerNav;
  }
}

function ModuleRouter() {
  const currentModule = useStore((s) => s.currentModule);
  const isLoading = useStore((s) => s.isLoading);

  if (isLoading) return <DashboardSkeleton />;

  switch (currentModule) {
    // Optimizer tab
    case 'opt-overview':
      return <Overview />;
    case 'dashboard':
      return <Dashboard />;
    case 'opt-campaigns':
    case 'campaigns':
      return <Campaigns />;
    case 'opt-signal':
    case 'signal':
    case 'opt-gateway':
    case 'gateway':
    case 'opt-audit':
    case 'signalaudit':
      return <SignalEngine />;
    case 'opt-financial':
    case 'financial':
      return <Financial />;
    case 'opt-settings':
    case 'settings':
      return <Settings />;

    // UTM tab
    case 'utm-campanhas':
    case 'utm-utms':
    case 'utm-vendas':
    case 'utm-relatorios':
    case 'utm-dashboard':
    case 'utm-sources':
    case 'utm-links':
    case 'utm-sales':
    case 'utm-webhooks':
    case 'utm':
      return <UTMTracking />;
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

    // Legacy fallbacks
    case 'audiences': return <Audiences />;
    case 'alerts': return <Alerts />;
    case 'agent': return <Agent />;
    case 'pipeline': return <Pipeline />;
    case 'create': return <CampaignCreator />;
    case 'opt-scale':
    case 'autoscale': return <AutoScale />;
    case 'playbook': return <Playbook />;

    default:
      return <Dashboard />;
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
      setCurrentModule('opt-overview');
    }
  }, [currentModule, setCurrentModule]);

  useEffect(() => {
    if (mode === 'demo') {
      setCampaigns(mockCampaigns);
      setAdSets(mockAdSetsData);
      setAds(mockAdsData);
      setCreatives(mockCreativesData);
      setAudiences(mockAudiences);
      setAlerts(mockAlerts);
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

  return (
    <AppLayout>
      <SubNav items={subNavItems} />
      <main style={{ flex: 1, padding: isMobile ? 12 : 24, paddingBottom: 100, overflow: 'auto', maxWidth: '100vw', boxSizing: 'border-box' }}>
        <ModuleRouter />
      </main>
    </AppLayout>
  );
}
