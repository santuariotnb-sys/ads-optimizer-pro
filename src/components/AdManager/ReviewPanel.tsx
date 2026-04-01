import React, { useState } from 'react';
import {
  Megaphone,
  Users,
  ImageIcon,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Rocket,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import type { SafetyCheckResult } from '../../services/adManagerService';

// ─── Label Maps ────────────────────────────────────────────────────────

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_SALES: 'Vendas',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_ENGAGEMENT: 'Engajamento',
  OUTCOME_AWARENESS: 'Reconhecimento',
  OUTCOME_TRAFFIC: 'Trafego',
  OUTCOME_APP_PROMOTION: 'Promover App',
};

const CTA_LABELS: Record<string, string> = {
  SHOP_NOW: 'Comprar Agora',
  LEARN_MORE: 'Saiba Mais',
  SIGN_UP: 'Cadastre-se',
  SUBSCRIBE: 'Assinar',
  CONTACT_US: 'Fale Conosco',
  GET_OFFER: 'Obter Oferta',
  DOWNLOAD: 'Baixar',
  BOOK_TRAVEL: 'Reservar',
  APPLY_NOW: 'Aplicar Agora',
  WATCH_MORE: 'Assistir Mais',
  NO_BUTTON: 'Sem Botao',
};

const OPTIMIZATION_LABELS: Record<string, string> = {
  OFFSITE_CONVERSIONS: 'Conversoes',
  LINK_CLICKS: 'Cliques no Link',
  IMPRESSIONS: 'Impressoes',
  REACH: 'Alcance',
  LANDING_PAGE_VIEWS: 'Visualizacoes da Pagina',
  LEAD_GENERATION: 'Geracao de Leads',
  VALUE: 'Valor',
};

const FORMAT_LABELS: Record<string, string> = {
  image: 'Imagem Unica',
  video: 'Video',
  carousel: 'Carrossel',
};

// ─── Props ─────────────────────────────────────────────────────────────

interface ReviewPanelProps {
  campaignSummary: {
    name: string;
    objective: string;
    budget: number;
    budgetType: string;
  };
  adSetSummary: {
    name: string;
    optimizationGoal: string;
    budget: number;
    countries: string[];
    ageRange: string;
    placements: string;
  };
  adSummary: {
    name: string;
    format: string;
    hasMedia: boolean;
    hasUrl: boolean;
    hasTracking: boolean;
    ctaType: string;
  };
  safetyChecks: SafetyCheckResult[];
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

// ─── Styles ────────────────────────────────────────────────────────────

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,.34)',
  backdropFilter: 'blur(28px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,.55)',
  borderRadius: 20,
  boxShadow:
    '0 30px 120px -45px rgba(15,23,42,.26), inset 0 1px 0 rgba(255,255,255,.92)',
  padding: 24,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#64748b',
  margin: 0,
};

const valueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#1e293b',
  margin: '2px 0 12px',
};

// ─── Helpers ───────────────────────────────────────────────────────────

function getLabel(map: Record<string, string>, key: string): string {
  return map[key] ?? key;
}

const STATUS_COLORS: Record<string, string> = {
  pass: '#22c55e',
  warn: '#f59e0b',
  fail: '#ef4444',
};

function StatusIcon({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  if (status === 'pass') return <CheckCircle size={18} color="#22c55e" />;
  if (status === 'warn') return <AlertTriangle size={18} color="#f59e0b" />;
  return <XCircle size={18} color="#ef4444" />;
}

// ─── Component ─────────────────────────────────────────────────────────

function ReviewPanel({
  campaignSummary,
  adSetSummary,
  adSummary,
  safetyChecks,
  isSubmitting,
  onSubmit,
  onBack,
}: ReviewPanelProps) {
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);

  const failCount = safetyChecks.filter((c) => c.status === 'fail').length;
  const warnCount = safetyChecks.filter((c) => c.status === 'warn').length;
  const allPass = failCount === 0 && warnCount === 0;
  const hasFailures = failCount > 0;

  const boolIcon = (val: boolean) => (val ? '\u2713' : '\u2717');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Warning Banner */}
      <div
        style={{
          ...glassCard,
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 16,
        }}
      >
        <Shield size={20} color="#10b981" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>
          Todas as campanhas sao criadas como PAUSADAS. Ative manualmente apos
          revisao no Meta Ads Manager.
        </span>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {/* Campaign Card */}
        <div style={glassCard}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Megaphone size={18} color="#6366f1" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
              Campanha
            </span>
          </div>
          <p style={labelStyle}>Nome</p>
          <p style={valueStyle}>{campaignSummary.name}</p>
          <p style={labelStyle}>Objetivo</p>
          <p style={valueStyle}>
            {getLabel(OBJECTIVE_LABELS, campaignSummary.objective)}
          </p>
          <p style={labelStyle}>Orcamento</p>
          <p style={{ ...valueStyle, marginBottom: 0 }}>
            R$ {campaignSummary.budget.toFixed(2)}/{campaignSummary.budgetType}
          </p>
        </div>

        {/* Ad Set Card */}
        <div style={glassCard}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Users size={18} color="#6366f1" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
              Conjunto de Anuncios
            </span>
          </div>
          <p style={labelStyle}>Nome</p>
          <p style={valueStyle}>{adSetSummary.name}</p>
          <p style={labelStyle}>Otimizacao</p>
          <p style={valueStyle}>
            {getLabel(OPTIMIZATION_LABELS, adSetSummary.optimizationGoal)}
          </p>
          <p style={labelStyle}>Orcamento</p>
          <p style={valueStyle}>
            R$ {adSetSummary.budget.toFixed(2)}/dia
          </p>
          <p style={labelStyle}>Paises</p>
          <p style={valueStyle}>{adSetSummary.countries.join(', ')}</p>
          <p style={labelStyle}>Idade</p>
          <p style={valueStyle}>{adSetSummary.ageRange}</p>
          <p style={labelStyle}>Posicionamentos</p>
          <p style={{ ...valueStyle, marginBottom: 0 }}>
            {adSetSummary.placements}
          </p>
        </div>

        {/* Ad Card */}
        <div style={glassCard}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <ImageIcon size={18} color="#6366f1" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
              Anuncio
            </span>
          </div>
          <p style={labelStyle}>Nome</p>
          <p style={valueStyle}>{adSummary.name}</p>
          <p style={labelStyle}>Formato</p>
          <p style={valueStyle}>
            {getLabel(FORMAT_LABELS, adSummary.format)}
          </p>
          <p style={labelStyle}>Midia</p>
          <p style={valueStyle}>{boolIcon(adSummary.hasMedia)}</p>
          <p style={labelStyle}>URL</p>
          <p style={valueStyle}>{boolIcon(adSummary.hasUrl)}</p>
          <p style={labelStyle}>Rastreamento</p>
          <p style={valueStyle}>{boolIcon(adSummary.hasTracking)}</p>
          <p style={labelStyle}>CTA</p>
          <p style={{ ...valueStyle, marginBottom: 0 }}>
            {getLabel(CTA_LABELS, adSummary.ctaType)}
          </p>
        </div>
      </div>

      {/* Safety Checks */}
      <div style={glassCard}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Shield size={18} color="#6366f1" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
            Verificacoes de Seguranca
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {safetyChecks.map((check) => (
            <div
              key={check.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                borderLeft: `3px solid ${STATUS_COLORS[check.status]}`,
                borderRadius: 8,
                background: 'rgba(255,255,255,.2)',
              }}
            >
              <div style={{ marginTop: 1, flexShrink: 0 }}>
                <StatusIcon status={check.status} />
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#1e293b',
                  }}
                >
                  {check.label}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                  {check.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Status Bar */}
      {allPass && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            color: '#16a34a',
            fontWeight: 600,
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          {'\u2713'} Tudo verificado — pronto para criar
        </div>
      )}
      {!allPass && !hasFailures && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: '#d97706',
            fontWeight: 600,
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          {'\u26a0'} {warnCount} aviso{warnCount > 1 ? 's' : ''} — revise antes
          de criar
        </div>
      )}
      {hasFailures && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#dc2626',
            fontWeight: 600,
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          {'\u2717'} {failCount} problema{failCount > 1 ? 's' : ''} — corrija
          antes de criar
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexDirection: isMobile ? 'column-reverse' : 'row',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '12px 20px',
            borderRadius: 12,
            transition: 'color .2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget.style.color = '#1e293b');
          }}
          onMouseLeave={(e) => {
            (e.currentTarget.style.color = '#64748b');
          }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={hasFailures || isSubmitting}
          onMouseEnter={() => !hasFailures && !isSubmitting && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '16px 32px',
            fontSize: 16,
            fontWeight: 700,
            cursor: hasFailures || isSubmitting ? 'not-allowed' : 'pointer',
            opacity: hasFailures || isSubmitting ? 0.5 : 1,
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            boxShadow: isHovered
              ? '0 20px 60px -15px rgba(99, 102, 241, 0.5)'
              : '0 10px 40px -15px rgba(99, 102, 241, 0.3)',
            transition: 'transform .2s ease, box-shadow .2s ease, opacity .2s ease',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2
                size={18}
                style={{ animation: 'spin 1s linear infinite' }}
              />
              Criando...
            </>
          ) : (
            <>
              <Rocket size={18} />
              Criar Campanha (PAUSADA)
            </>
          )}
        </button>
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ReviewPanel;
