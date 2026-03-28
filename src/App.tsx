import { useEffect } from 'react';
import { useStore } from './store/useStore';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './components/Dashboard/Dashboard';
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
import {
  mockCampaigns,
  mockAdSetsData,
  mockAdsData,
  mockCreativesData,
  mockAudiences,
  mockAlerts,
  mockDashboardMetrics,
  mockEMQ,
} from './data/mockData';

function ModuleRouter() {
  const currentModule = useStore((s) => s.currentModule);

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
    case 'playbook':
      return <Playbook />;
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
    mode,
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
    }
  }, [mode, setCampaigns, setAdSets, setAds, setCreatives, setAudiences, setAlerts, setMetrics, setEMQScore]);

  return (
    <AppLayout>
      <ModuleRouter />
    </AppLayout>
  );
}
