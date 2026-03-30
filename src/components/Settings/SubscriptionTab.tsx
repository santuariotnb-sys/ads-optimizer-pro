import { motion } from 'motion/react';
import { Crown, Check, Sparkles, Zap, Building2 } from 'lucide-react';
import { useSubscription, type PlanId } from '../../hooks/useSubscription';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { COLORS, COLORS_LIGHT } from '../../utils/constants';

interface PlanCard {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  icon: typeof Crown;
  popular: boolean;
  features: string[];
  cta: string;
  href: string;
}

const PLANS: PlanCard[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 97',
    period: '/mes',
    icon: Sparkles,
    popular: false,
    features: [
      'Ate 15 campanhas',
      '3 integracoes',
      'Dashboard completo',
      'UTM Tracking',
      'Financeiro',
      'Alertas inteligentes',
      'Gestao de publicos',
    ],
    cta: 'Comecar com Starter',
    href: '#starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 197',
    period: '/mes',
    icon: Zap,
    popular: true,
    features: [
      'Ate 50 campanhas',
      '10 integracoes',
      'Tudo do Starter +',
      'Analise de Criativos IA',
      'Signal Gateway (CAPI)',
      'Agente IA',
      'Suporte prioritario',
    ],
    cta: 'Escolher Pro',
    href: '#pro',
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 'R$ 397',
    period: '/mes',
    icon: Building2,
    popular: false,
    features: [
      'Campanhas ilimitadas',
      'Integracoes ilimitadas',
      'Tudo do Pro +',
      'Auto Scale',
      'Flow Builder',
      'Multi-workspace',
      'Suporte dedicado',
    ],
    cta: 'Escolher Agency',
    href: '#agency',
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativo', color: '#10b981' },
  cancelled: { label: 'Cancelado', color: '#f59e0b' },
  inactive: { label: 'Inativo', color: '#64748b' },
  free: { label: 'Gratuito', color: '#64748b' },
};

export default function SubscriptionTab() {
  const { plan, loading } = useSubscription();
  const theme = useStore((s) => s.theme);
  const isMobile = useIsMobile();
  const c = theme === 'dark' ? COLORS : COLORS_LIGHT;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: c.textMuted }}>
        Carregando...
      </div>
    );
  }

  const statusInfo = plan === 'free' || plan === 'demo'
    ? STATUS_LABELS.free
    : STATUS_LABELS.active;

  const planLabel = plan === 'demo' ? 'Demo (acesso total)' : plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Current plan status */}
      <div
        style={{
          padding: 24,
          borderRadius: 16,
          background: c.surface2,
          border: `1px solid ${c.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Crown size={22} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
            Plano atual
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>
            {planLabel}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 20,
            background: `${statusInfo.color}15`,
            border: `1px solid ${statusInfo.color}30`,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusInfo.color }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Plan cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {PLANS.map((planCard, i) => {
          const isCurrentPlan = plan === planCard.id;
          const Icon = planCard.icon;

          return (
            <motion.div
              key={planCard.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                position: 'relative',
                padding: 28,
                borderRadius: 18,
                background: planCard.popular
                  ? theme === 'dark'
                    ? 'rgba(99, 102, 241, 0.08)'
                    : 'rgba(99, 102, 241, 0.04)'
                  : c.surface2,
                border: planCard.popular
                  ? `2px solid ${c.accent}`
                  : `1px solid ${c.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                boxShadow: planCard.popular
                  ? `0 4px 30px ${c.accentGlow}`
                  : 'none',
              }}
            >
              {/* Popular badge */}
              {planCard.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '5px 16px',
                    borderRadius: 20,
                    background: `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Mais Popular
                </div>
              )}

              {/* Plan header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: planCard.popular
                      ? `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`
                      : c.surface3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={planCard.popular ? '#fff' : c.textMuted} />
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>
                  {planCard.name}
                </span>
              </div>

              {/* Price */}
              <div>
                <span style={{ fontSize: 32, fontWeight: 800, color: c.text, fontFamily: 'Space Grotesk' }}>
                  {planCard.price}
                </span>
                <span style={{ fontSize: 14, color: c.textMuted }}>{planCard.period}</span>
              </div>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {planCard.features.map((feat) => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Check size={14} color={c.success} />
                    <span style={{ fontSize: 13, color: c.textSecondary }}>{feat}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {isCurrentPlan ? (
                <div
                  style={{
                    padding: '14px 24px',
                    borderRadius: 12,
                    background: `${c.success}15`,
                    border: `1px solid ${c.success}30`,
                    color: c.success,
                    fontSize: 14,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Plano atual
                </div>
              ) : (
                <a
                  href={planCard.href}
                  style={{
                    display: 'block',
                    padding: '14px 24px',
                    borderRadius: 12,
                    background: planCard.popular
                      ? `linear-gradient(135deg, ${c.accent}, ${c.accentHover})`
                      : 'transparent',
                    border: planCard.popular
                      ? 'none'
                      : `1px solid ${c.border}`,
                    color: planCard.popular ? '#fff' : c.text,
                    fontSize: 14,
                    fontWeight: 700,
                    textAlign: 'center',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                >
                  {planCard.cta}
                </a>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
