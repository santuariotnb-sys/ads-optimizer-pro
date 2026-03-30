import { create } from 'zustand';
import type { Campaign, AdSet, Ad, Creative, Audience, Alert, DashboardMetrics, Period, AppMode, ChatMessage, SignalAuditResult } from '../types/meta';
import type { CreativeAnalysisResult } from '../services/creativeVision';

interface AppState {
  theme: 'dark' | 'light';
  mode: AppMode;
  accessToken: string | null;
  adAccountId: string | null;

  campaigns: Campaign[];
  adSets: AdSet[];
  ads: Ad[];
  creatives: Creative[];
  audiences: Audience[];
  alerts: Alert[];
  chatMessages: ChatMessage[];

  metrics: DashboardMetrics;
  emqScore: number;

  selectedPeriod: Period;
  selectedCampaign: string | null;
  currentModule: string;
  sidebarCollapsed: boolean;
  isLoading: boolean;
  signalAudit: SignalAuditResult | null;
  creativeAnalysisContext: CreativeAnalysisResult | null;

  setAccessToken: (token: string | null) => void;
  setAdAccountId: (id: string | null) => void;
  setCampaigns: (campaigns: Campaign[]) => void;
  setAdSets: (adSets: AdSet[]) => void;
  setAds: (ads: Ad[]) => void;
  setCreatives: (creatives: Creative[]) => void;
  setAudiences: (audiences: Audience[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setMetrics: (metrics: DashboardMetrics) => void;
  setEMQScore: (score: number) => void;
  setSelectedPeriod: (period: Period) => void;
  setSelectedCampaign: (id: string | null) => void;
  setCurrentModule: (module: string) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  setIsLoading: (loading: boolean) => void;
  setSignalAudit: (audit: SignalAuditResult | null) => void;
  setCreativeAnalysisContext: (ctx: CreativeAnalysisResult | null) => void;
}

export const useStore = create<AppState>((set) => ({
  theme: 'dark',
  mode: 'demo',
  accessToken: null,
  adAccountId: null,

  campaigns: [],
  adSets: [],
  ads: [],
  creatives: [],
  audiences: [],
  alerts: [],
  chatMessages: [],

  metrics: { cpa: 0, roas: 0, ctr: 0, cpm: 0, mer: 0, spend: 0, conversions: 0, accountScore: 0 },
  emqScore: 0,

  selectedPeriod: '7d',
  selectedCampaign: null,
  currentModule: 'dashboard',
  sidebarCollapsed: false,
  isLoading: false,
  signalAudit: null,
  creativeAnalysisContext: null,

  setAccessToken: (token) => set({ accessToken: token, mode: token ? 'live' : 'demo' }),
  setAdAccountId: (id) => set({ adAccountId: id }),
  setCampaigns: (campaigns) => set({ campaigns }),
  setAdSets: (adSets) => set({ adSets }),
  setAds: (ads) => set({ ads }),
  setCreatives: (creatives) => set({ creatives }),
  setAudiences: (audiences) => set({ audiences }),
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts] })),
  dismissAlert: (id) => set((s) => ({
    alerts: s.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a),
  })),
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  setMetrics: (metrics) => set({ metrics }),
  setEMQScore: (score) => set({ emqScore: score }),
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  setSelectedCampaign: (id) => set({ selectedCampaign: id }),
  setCurrentModule: (module) => set({ currentModule: module }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSignalAudit: (audit) => set({ signalAudit: audit }),
  setCreativeAnalysisContext: (ctx) => set({ creativeAnalysisContext: ctx }),
}));
