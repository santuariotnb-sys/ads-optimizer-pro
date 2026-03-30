import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export type PlanId = 'free' | 'starter' | 'pro' | 'agency' | 'demo';

export type FeatureId =
  | 'overview'
  | 'campaigns'
  | 'utm'
  | 'financial'
  | 'settings'
  | 'creativeIntel'
  | 'signalGateway'
  | 'agentAI'
  | 'autoScale'
  | 'audiences'
  | 'alerts'
  | 'pipeline';

interface PlanLimits {
  maxCampaigns: number;
  maxIntegrations: number;
  features: FeatureId[];
}

const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxCampaigns: 5,
    maxIntegrations: 1,
    features: ['overview', 'campaigns', 'utm', 'financial', 'settings', 'audiences', 'alerts'],
  },
  starter: {
    maxCampaigns: 15,
    maxIntegrations: 3,
    features: ['overview', 'campaigns', 'utm', 'financial', 'settings', 'audiences', 'alerts'],
  },
  pro: {
    maxCampaigns: 50,
    maxIntegrations: 10,
    features: ['overview', 'campaigns', 'utm', 'financial', 'settings', 'audiences', 'alerts', 'creativeIntel', 'signalGateway', 'agentAI'],
  },
  agency: {
    maxCampaigns: -1, // unlimited
    maxIntegrations: -1,
    features: ['overview', 'campaigns', 'utm', 'financial', 'settings', 'audiences', 'alerts', 'creativeIntel', 'signalGateway', 'agentAI', 'autoScale', 'pipeline'],
  },
  demo: {
    maxCampaigns: -1,
    maxIntegrations: -1,
    features: ['overview', 'campaigns', 'utm', 'financial', 'settings', 'audiences', 'alerts', 'creativeIntel', 'signalGateway', 'agentAI', 'autoScale', 'pipeline'],
  },
};

const FEATURE_REQUIRED_PLAN: Record<FeatureId, PlanId> = {
  overview: 'free',
  campaigns: 'free',
  utm: 'free',
  financial: 'free',
  settings: 'free',
  audiences: 'free',
  alerts: 'free',
  creativeIntel: 'pro',
  signalGateway: 'pro',
  agentAI: 'pro',
  autoScale: 'agency',
  pipeline: 'agency',
};

export function useSubscription() {
  const mode = useStore((s) => s.mode);
  const [plan, setPlan] = useState<PlanId>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mode === 'demo') {
      setPlan('demo');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadPlan() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled || !user) {
          setPlan('free');
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, plan_expires_at')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (profile?.plan && profile.plan !== 'free') {
          const expiresAt = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null;
          if (!expiresAt || expiresAt > new Date()) {
            setPlan(profile.plan as PlanId);
          } else {
            setPlan('free');
          }
        } else {
          setPlan('free');
        }
      } catch {
        setPlan('free');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlan();
    return () => { cancelled = true; };
  }, [mode]);

  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  function canAccess(feature: FeatureId): boolean {
    return limits.features.includes(feature);
  }

  function requiredPlan(feature: FeatureId): PlanId {
    return FEATURE_REQUIRED_PLAN[feature] || 'free';
  }

  return { plan, limits, canAccess, requiredPlan, loading };
}
