import { useEffect } from 'react';
import { useStore } from './store/useStore';
import AppLayout from './components/Layout/AppLayout';
import SubNav from './components/Layout/SubNav';
import { DashboardSkeleton } from './components/LoadingSkeleton';

// Modules — lazy-ish imports (all sync for now, can React.lazy later)
import Dashboard from './components/Dashboard/Dashboard';
import Overview from './components/Overview/Overview';
import Campaigns from './components/Campaigns/Campaigns';
import Creatives from './components/Creatives/Creatives';
import SignalEngine from './components/SignalEngine/SignalEngine';
import SignalAudit from './components/SignalAudit/SignalAudit';
import SignalGateway from './components/SignalGateway/SignalGateway';
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

import { parseCallbackToken } from './services/metaAuth';
import { MetaApiService } from './services/metaApi';
import {
  mockCampaigns, mockAdSetsData, mockAdsData, mockCreativesData,
  mockAudiences, mockAlerts, mockDashboardMetrics, mockEMQ, mockSignalAudit,
} from './data/mockData';

import {
  LayoutDashboard, Megaphone, Radio, TrendingUp, DollarSign, Settings as SettingsIcon,
  BarChart3, Link2, ShoppingCart, Zap, Globe,
  Sparkles, Image, GitCompare, Upload,
  Satellite, ShieldCheck,
} from 'lucide-react';

// Sub-nav definitions for each main tab
const optimizerNav = [
  { id: 'opt-overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'opt-campaigns', label: 'Campanhas', icon: Megaphone },
  { id: 'opt-signal', label: 'Signal', icon: Radio },
  { id: 'opt-gateway', label: 'Gateway', icon: Satellite },
  { id: 'opt-audit', label: 'Audit', icon: ShieldCheck },
  { id: 'opt-scale', label: 'Escala', icon: TrendingUp },
  { id: 'opt-financial', label: 'Financeiro', icon: DollarSign },
  { id: 'opt-settings', label: 'Config', icon: SettingsIcon },
];

const utmNav = [
  { id: 'utm-dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'utm-sources', label: 'Fontes', icon: Link2 },
  { id: 'utm-sales', label: 'Vendas', icon: ShoppingCart },
  { id: 'utm-links', label: 'Links', icon: Zap },
  { id: 'utm-webhooks', label: 'Webhooks', icon: Globe },
];

const creativeNav = [
  { id: 'cre-dashboard', label: 'Dashboard', icon: Sparkles },
  { id: 'cre-analysis', label: 'Criativos', icon: Image },
  { id: 'cre-compare', label: 'Comparar', icon: GitCompare },
  { id: 'cre-upload', label: 'Upload', icon: Upload },
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
      return <SignalEngine />;
    case 'opt-gateway':
    case 'gateway':
      return <SignalGateway />;
    case 'opt-audit':
    case 'signalaudit':
      return <SignalAudit />;
    case 'opt-scale':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <AutoScale />
          <Audiences />
        </div>
      );
    case 'opt-financial':
    case 'financial':
      return <Financial />;
    case 'opt-settings':
    case 'settings':
      return <Settings />;

    // UTM tab
    case 'utm-dashboard':
    case 'utm-sources':
    case 'utm-links':
    case 'utm':
      return <UTMTracking />;
    case 'utm-sales':
      return <UTMTracking />;
    case 'utm-webhooks':
      return <UTMTracking />;

    // Creative tab
    case 'cre-dashboard':
    case 'cre-analysis':
    case 'creatives':
      return <Creatives />;
    case 'cre-compare':
      return <Creatives />;
    case 'cre-upload':
      return <Creatives />;

    // Legacy fallbacks
    case 'audiences': return <Audiences />;
    case 'alerts': return <Alerts />;
    case 'agent': return <Agent />;
    case 'pipeline': return <Pipeline />;
    case 'create': return <CampaignCreator />;
    case 'autoscale': return <AutoScale />;
    case 'playbook': return <Playbook />;

    default:
      return <Dashboard />;
  }
}

export default function App() {
  const {
    setCampaigns, setAdSets, setAds, setCreatives, setAudiences,
    setAlerts, setMetrics, setEMQScore, setSignalAudit, setIsLoading,
    setAccessToken, setCurrentModule, mode, accessToken, adAccountId, currentModule,
  } = useStore();

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
      <div style={{ marginTop: 16 }}>
        <ModuleRouter />
      </div>
    </AppLayout>
  );
}
