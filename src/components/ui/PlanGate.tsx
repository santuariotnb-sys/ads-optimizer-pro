import type { ReactNode } from 'react';
import { Lock, ArrowUpRight, Crown } from 'lucide-react';
import { useSubscription, type FeatureId, type PlanId } from '../../hooks/useSubscription';
import { useStore } from '../../store/useStore';
import { COLORS, COLORS_LIGHT } from '../../utils/constants';

const PLAN_LABELS: Record<PlanId, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  agency: 'Agency',
  demo: 'Demo',
};

const PLAN_PRICES: Record<PlanId, string> = {
  free: '0',
  starter: '97',
  pro: '197',
  agency: '397',
  demo: '0',
};

const FEATURE_LABELS: Record<FeatureId, { title: string; description: string }> = {
  overview: { title: 'Visao Geral', description: 'Dashboard principal com metricas.' },
  campaigns: { title: 'Campanhas', description: 'Gestao de campanhas.' },
  utm: { title: 'UTM Tracking', description: 'Rastreamento de UTMs.' },
  financial: { title: 'Financeiro', description: 'Controle financeiro.' },
  settings: { title: 'Configuracoes', description: 'Configuracoes do sistema.' },
  audiences: { title: 'Publicos', description: 'Gestao de publicos.' },
  alerts: { title: 'Alertas', description: 'Alertas inteligentes.' },
  creativeIntel: { title: 'Analise de Criativos IA', description: 'Analise automatica de criativos com inteligencia artificial, identificando padroes visuais e copy de alto desempenho.' },
  signalGateway: { title: 'Signal Gateway', description: 'Roteamento avancado de sinais CAPI com enriquecimento de dados e deduplicacao inteligente.' },
  agentAI: { title: 'Agente IA', description: 'Assistente de IA que analisa campanhas, sugere otimizacoes e executa acoes automaticamente.' },
  autoScale: { title: 'Auto Scale', description: 'Escalonamento automatico de orcamento baseado em performance, com regras de seguranca e cooldown.' },
  pipeline: { title: 'Flow Builder', description: 'Construtor de fluxos de automacao para campanhas e acoes em cadeia.' },
};

interface PlanGateProps {
  feature: FeatureId;
  children: ReactNode;
}

export default function PlanGate({ feature, children }: PlanGateProps) {
  const { plan, canAccess, requiredPlan } = useSubscription();
  const theme = useStore((s) => s.theme);
  const c = theme === 'dark' ? COLORS : COLORS_LIGHT;

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  const required = requiredPlan(feature);
  const featureInfo = FEATURE_LABELS[feature];
  const price = PLAN_PRICES[required];
  const planLabel = PLAN_LABELS[required];
  const currentLabel = PLAN_LABELS[plan];

  return (
    <div style={{ position: 'relative', minHeight: 400 }}>
      {/* Blurred preview of children */}
      <div
        style={{
          filter: 'blur(8px)',
          opacity: 0.3,
          pointerEvents: 'none',
          userSelect: 'none',
          overflow: 'hidden',
          maxHeight: 500,
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: '90%',
            padding: 32,
            borderRadius: 20,
            background: theme === 'dark'
              ? 'rgba(22, 22, 32, 0.92)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${c.border}`,
            boxShadow: `0 8px 40px rgba(0,0,0,0.2), 0 0 60px ${c.accentGlow}`,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* Lock icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 20px ${c.accentGlow}`,
            }}
          >
            <Lock size={24} color="#fff" />
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: c.text,
              fontFamily: 'Space Grotesk',
              margin: 0,
            }}
          >
            {featureInfo.title}
          </h2>

          {/* Plan badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 20,
              background: `linear-gradient(135deg, ${c.accent}20, ${c.accentHover}20)`,
              border: `1px solid ${c.accent}40`,
              fontSize: 12,
              fontWeight: 700,
              color: c.accent,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            <Crown size={13} />
            Exclusivo do plano {planLabel}
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: 14,
              color: c.textMuted,
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 340,
            }}
          >
            {featureInfo.description}
          </p>

          {/* CTA Button */}
          <a
            href={`#${required}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer',
              border: 'none',
              boxShadow: `0 4px 20px ${c.accentGlow}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            Fazer upgrade &rarr; R${price}/mes
            <ArrowUpRight size={16} />
          </a>

          {/* Current plan indicator */}
          <div
            style={{
              fontSize: 12,
              color: c.textMuted,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: plan === 'free' ? c.textMuted : c.success,
              }}
            />
            Seu plano atual: {currentLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
