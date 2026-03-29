import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { MetaApiService } from './services/metaApi';
import { parseCallbackToken } from './services/metaAuth';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './components/Dashboard/Dashboard';
import { DashboardSkeleton } from './components/LoadingSkeleton';
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
import SignalAudit from './components/SignalAudit/SignalAudit';
import Financial from './components/Financial/Financial';
import UTMTracking from './components/UTMTracking/UTMTracking';
import Settings from './components/Settings/Settings';
import SignalGateway from './components/SignalGateway/SignalGateway';
import {
  mockCampaigns,
  mockAdSetsData,
  mockAdsData,
  mockCreativesData,
  mockAudiences,
  mockAlerts,
  mockDashboardMetrics,
  mockEMQ,
  mockSignalAudit,
} from './data/mockData';

function ModuleRouter() {
  const currentModule = useStore((s) => s.currentModule);
  const isLoading = useStore((s) => s.isLoading);

  if (isLoading) return <DashboardSkeleton />;

  switch (currentModule) {
    case 'dashboard':
      return <Dashboard />;
    case 'campaigns':
      return <Campaigns />;
    case 'creatives':
      return <Creatives />;
    case 'signal':
      return <SignalEngine />;
    case 'audiences':
      return <Audiences />;
    case 'alerts':
      return <Alerts />;
    case 'agent':
      return <Agent />;
    case 'pipeline':
      return <Pipeline />;
    case 'create':
      return <CampaignCreator />;
    case 'autoscale':
      return <AutoScale />;
    case 'signalaudit':
      return <SignalAudit />;
    case 'playbook':
      return <Playbook />;
    case 'financial':
      return <Financial />;
    case 'utm':
      return <UTMTracking />;
    case 'gateway':
      return <SignalGateway />;
    case 'settings':
      return <Settings />;
    default:
      return <Dashboard />;
  }
}

export default function App() {
  const {
    setCampaigns,
    setAdSets,
    setAds,
    setCreatives,
    setAudiences,
    setAlerts,
    setMetrics,
    setEMQScore,
    setSignalAudit,
    setIsLoading,
    setAccessToken,
    mode,
    accessToken,
    adAccountId,
  } = useStore();

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
      // Clean URL hash
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
          // Map API response to our Campaign type
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

          // Fetch insights for each campaign
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
          setCampaigns([...campaigns]); // Trigger re-render with enriched data
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
        // Fall back to demo mode on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchLiveData();
  }, [mode, accessToken, adAccountId, setCampaigns, setAudiences, setIsLoading]);

  return (
    <AppLayout>
      <ModuleRouter />
    </AppLayout>
  );
}
