import { useState } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import {
  Settings, TrendingUp, TrendingDown, RefreshCw, Info, Search,
} from 'lucide-react';

type Platform = 'meta' | 'google' | 'tiktok' | 'kwai';
type SubTab = 'contas' | 'campanhas' | 'conjuntos' | 'anuncios';

interface PlatformAdsProps {
  platform: Platform;
}

// ── Platform config ─────────────────────────────────────────────────────────

const platformConfig: Record<Platform, {
  name: string;
  color: string;
  subTabLabels: Record<SubTab, string>;
  columns: Record<SubTab, string[]>;
}> = {
  meta: {
    name: 'Meta Ads',
    color: '#6366f1',
    subTabLabels: { contas: 'Contas', campanhas: 'Campanhas', conjuntos: 'Conjuntos', anuncios: 'Anúncios' },
    columns: {
      contas: ['CONTA', 'ORÇAMENTO', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'IC'],
      campanhas: ['STATUS', 'CAMPANHA', 'VEICULAÇÃO', 'ORÇAMENTO', 'CPA DESEJADO', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'IC', 'CPI', 'CPC', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'],
      conjuntos: ['STATUS', 'CONJUNTO', 'VEICULAÇÃO', 'ORÇAMENTO', 'BID', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'IC', 'CPC', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'],
      anuncios: ['STATUS', 'ANÚNCIO', 'VEICULAÇÃO', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'CPC', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'],
    },
  },
  google: {
    name: 'Google Ads',
    color: '#4285F4',
    subTabLabels: { contas: 'Contas', campanhas: 'Campanhas', conjuntos: 'Grupos', anuncios: 'Anúncios' },
    columns: {
      contas: ['CONTA', 'ORÇAMENTO', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'IC'],
      campanhas: ['STATUS', 'CAMPANHA', 'TIPO', 'ORÇAMENTO', 'BID', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'IC', 'CPI', 'CPC', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'],
      conjuntos: ['STATUS', 'GRUPO', 'TIPO', 'ORÇAMENTO', 'BID', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'CPC', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'],
      anuncios: ['STATUS', 'ANÚNCIO', 'TIPO', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'CPC', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'],
    },
  },
  tiktok: {
    name: 'TikTok Ads',
    color: '#ff0050',
    subTabLabels: { contas: 'Contas', campanhas: 'Campanhas', conjuntos: 'Grupos', anuncios: 'Anúncios' },
    columns: {
      contas: ['CONTA', 'ORÇAMENTO', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'IC'],
      campanhas: ['STATUS', 'CAMPANHA', 'VEICULAÇÃO', 'ORÇAMENTO', 'BID', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'IC', 'CPI', 'CPC', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'],
      conjuntos: ['STATUS', 'GRUPO', 'VEICULAÇÃO', 'ORÇAMENTO', 'BID', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'CPC', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'],
      anuncios: ['STATUS', 'ANÚNCIO', 'VEICULAÇÃO', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'CPC', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'],
    },
  },
  kwai: {
    name: 'Kwai Ads',
    color: '#ff6600',
    subTabLabels: { contas: 'Contas', campanhas: 'Campanhas', conjuntos: 'Conjuntos', anuncios: 'Anúncios' },
    columns: {
      contas: ['CONTA', 'ORÇAMENTO', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'IC'],
      campanhas: ['STATUS', 'CAMPANHA', 'VEICULAÇÃO', 'ORÇAMENTO', 'BID', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'IC', 'CPI', 'CPC', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'],
      conjuntos: ['STATUS', 'CONJUNTO', 'VEICULAÇÃO', 'ORÇAMENTO', 'BID', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'CPC', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'],
      anuncios: ['STATUS', 'ANÚNCIO', 'VEICULAÇÃO', 'VENDAS', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'ROAS', 'MARGEM', 'ROI', 'CPC', 'CTR', 'CPM', 'IMPRESSÕES', 'CLIQUES'],
    },
  },
};

const SUB_TABS: SubTab[] = ['contas', 'campanhas', 'conjuntos', 'anuncios'];

// ── Styles ──────────────────────────────────────────────────────────────────

const S = {
  select: {
    padding: '8px 14px',
    borderRadius: 14,
    border: 'none',
    background: 'rgba(240,243,248,0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    color: '#334155',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'Outfit, sans-serif',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 30,
    boxShadow: '6px 6px 14px rgba(15,23,42,0.07), -4px -4px 10px rgba(255,255,255,0.85), inset 0 1px 0 rgba(255,255,255,0.6)',
  } as React.CSSProperties,
  input: {
    padding: '8px 14px',
    paddingLeft: 36,
    borderRadius: 14,
    border: 'none',
    background: 'rgba(240,243,248,0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    color: '#334155',
    fontSize: 13,
    fontWeight: 500,
    outline: 'none',
    fontFamily: 'Outfit, sans-serif',
    boxShadow: '6px 6px 14px rgba(15,23,42,0.07), -4px -4px 10px rgba(255,255,255,0.85), inset 0 1px 0 rgba(255,255,255,0.6)',
    minWidth: 200,
  } as React.CSSProperties,
  card: {
    position: 'relative' as const,
    background: 'rgba(240,243,248,0.55)',
    backdropFilter: 'blur(48px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(48px) saturate(1.6)',
    border: '1px solid rgba(255,255,255,0.50)',
    borderRadius: 22,
    overflow: 'hidden' as const,
    boxShadow: '12px 12px 30px rgba(15,23,42,0.08), -8px -8px 24px rgba(255,255,255,0.90), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(255,255,255,0.15)',
  },
  th: {
    padding: '10px 14px',
    fontSize: 10,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    textAlign: 'left' as const,
    background: 'rgba(240,243,248,0.70)',
    backdropFilter: 'blur(16px)',
    whiteSpace: 'nowrap' as const,
    borderBottom: '1px solid rgba(255,255,255,0.6)',
    borderRight: '1px solid rgba(255,255,255,0.25)',
    fontFamily: 'Outfit, sans-serif',
    position: 'sticky' as const,
    top: 0,
    zIndex: 2,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
  } as React.CSSProperties,
  td: {
    padding: '9px 14px',
    fontSize: 13,
    color: '#1e293b',
    borderBottom: '1px solid rgba(15,23,42,0.05)',
    borderRight: '1px solid rgba(15,23,42,0.03)',
    whiteSpace: 'nowrap' as const,
    fontFamily: 'Outfit, sans-serif',
  } as React.CSSProperties,
  tdMono: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right' as const,
  } as React.CSSProperties,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function emptyRowLabel(tab: SubTab, labels: Record<SubTab, string>): string {
  const upper = labels[tab].toUpperCase();
  return `0 ${upper}`;
}

function emptyValue(col: string): string {
  const currency = ['ORÇAMENTO', 'CPA', 'GASTOS', 'FATURAMENTO', 'LUCRO', 'CPA DESEJADO', 'BID', 'CPC', 'CPM', 'CPI'];
  const pct = ['MARGEM', 'CTR'];
  const mult = ['ROAS'];
  const num = ['VENDAS', 'IMPRESSÕES', 'CLIQUES', 'ROI', 'IC'];
  if (currency.some(c => col === c)) return 'R$ 0,00';
  if (pct.some(c => col === c)) return '0,0%';
  if (mult.some(c => col === c)) return '0,00x';
  if (num.some(c => col === c)) return '0';
  return 'N/A';
}

// ── Component ───────────────────────────────────────────────────────────────

export default function PlatformAds({ platform }: PlatformAdsProps) {
  const isMobile = useIsMobile();
  const config = platformConfig[platform];
  const [activeTab, setActiveTab] = useState<SubTab>('campanhas');

  const columns = config.columns[activeTab];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Outfit, sans-serif' }}>

      {/* ── Sub-tabs ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid rgba(15,23,42,0.08)',
        overflowX: isMobile ? 'auto' : 'visible',
      }}>
        {SUB_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: isMobile ? '10px 16px' : '10px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? `2px solid ${config.color}` : '2px solid transparent',
                color: isActive ? '#0f172a' : '#64748b',
                fontFamily: 'Outfit, sans-serif',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {config.subTabLabels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── Toolbar row ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}>
        <button onClick={() => {}} style={{
          width: 34, height: 34, borderRadius: 10, border: 'none',
          background: 'rgba(240,243,248,0.65)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '4px 4px 10px rgba(15,23,42,0.06), -3px -3px 8px rgba(255,255,255,0.8)',
        }}>
          <Settings size={15} color="#64748b" />
        </button>
        <button onClick={() => {}} style={{
          width: 34, height: 34, borderRadius: 10, border: 'none',
          background: 'rgba(240,243,248,0.65)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '4px 4px 10px rgba(15,23,42,0.06), -3px -3px 8px rgba(255,255,255,0.8)',
        }}>
          <TrendingUp size={15} color="#64748b" />
        </button>
        <button onClick={() => {}} style={{
          width: 34, height: 34, borderRadius: 10, border: 'none',
          background: 'rgba(240,243,248,0.65)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '4px 4px 10px rgba(15,23,42,0.06), -3px -3px 8px rgba(255,255,255,0.8)',
        }}>
          <TrendingDown size={15} color="#64748b" />
        </button>

        <span style={{
          padding: '5px 12px',
          borderRadius: 20,
          background: 'rgba(74,222,128,0.12)',
          color: '#16a34a',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'Outfit, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
          Todas as vendas trackeadas
        </span>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'Outfit, sans-serif' }}>
          Atualizado agora mesmo
        </span>
        <button onClick={() => {}} style={{
          padding: '7px 16px',
          borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'Outfit, sans-serif',
          boxShadow: '4px 4px 14px rgba(59,130,246,0.25), -2px -2px 6px rgba(255,255,255,0.4)',
        }}>
          <RefreshCw size={13} />
          Atualizar
        </button>
      </div>

      {/* ── Filter row ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            placeholder={`Nome da ${config.subTabLabels[activeTab].slice(0, -1)}`}
            style={S.input}
          />
        </div>

        <select style={S.select}>
          <option>Status: Qualquer</option>
          <option>Ativo</option>
          <option>Pausado</option>
        </select>

        <select style={S.select}>
          <option>Período: Hoje</option>
          <option>Ontem</option>
          <option>Últimos 7 dias</option>
          <option>Últimos 30 dias</option>
          <option>Este mês</option>
        </select>

        <select style={S.select}>
          <option>Conta de Anúncio: Qualquer</option>
        </select>

        <select style={S.select}>
          <option>Produto: Qualquer</option>
        </select>

        {platform === 'kwai' && (
          <select style={S.select}>
            <option>Fuso Horário: UTC-3</option>
            <option>UTC-4</option>
            <option>UTC-5</option>
          </select>
        )}
      </div>

      {/* ── Data table ─────────────────────────────────────────────── */}
      <div style={S.card}>
        {/* Glass reflection layers */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)',
          pointerEvents: 'none', zIndex: 1, borderRadius: '22px 22px 0 0',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.06) 100%)',
          pointerEvents: 'none', zIndex: 1, borderRadius: 22,
        }} />

        <div style={{ position: 'relative', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            minWidth: isMobile ? 900 : 1100,
          }}>
            <thead>
              <tr>
                {/* Checkbox column */}
                <th style={{ ...S.th, width: 44, textAlign: 'center' }}>
                  <input type="checkbox" disabled style={{ accentColor: config.color, cursor: 'default' }} />
                </th>
                {columns.map((col, i) => (
                  <th key={col} style={{
                    ...S.th,
                    ...(i >= 2 ? { textAlign: 'right' as const } : {}),
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Empty state row */}
              <tr>
                <td style={{ ...S.td, textAlign: 'center' }}>
                  <input type="checkbox" disabled style={{ cursor: 'default' }} />
                </td>
                {columns.map((col, i) => (
                  <td key={col} style={{
                    ...S.td,
                    ...(i === 0 ? { fontWeight: 600 } : { ...S.tdMono }),
                    ...(i === 0 ? {} : {}),
                  }}>
                    {i === 0 ? emptyRowLabel(activeTab, config.subTabLabels) : emptyValue(col)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Help link ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'center',
        padding: '8px 0',
      }}>
        <Info size={14} color="#6366f1" />
        <span style={{
          fontSize: 13,
          color: '#6366f1',
          fontFamily: 'Outfit, sans-serif',
          cursor: 'pointer',
          textDecoration: 'underline',
          textDecorationColor: 'rgba(99,102,241,0.3)',
          textUnderlineOffset: 3,
        }}>
          Por que as campanhas não estão aparecendo?
        </span>
      </div>
    </div>
  );
}
