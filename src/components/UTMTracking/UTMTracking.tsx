import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Link, ExternalLink, Search, Filter,
  Copy, Target, Globe, Tag, Hash, BarChart3,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { COLORS, COLORS_LIGHT } from '../../utils/constants';
import { getUTMBreakdown, type UTMBreakdown } from '../../services/salesService';

// Mock data
const MOCK_UTM: UTMBreakdown[] = [
  { utm_source: 'facebook', utm_medium: 'cpc', utm_campaign: 'lancamento_python', vendas: 89, receita: 26433, ticket_medio: 297 },
  { utm_source: 'facebook', utm_medium: 'cpc', utm_campaign: 'remarketing_abandono', vendas: 34, receita: 10098, ticket_medio: 297 },
  { utm_source: 'instagram', utm_medium: 'stories', utm_campaign: 'stories_depoimento', vendas: 12, receita: 3564, ticket_medio: 297 },
  { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'search_python', vendas: 8, receita: 2376, ticket_medio: 297 },
  { utm_source: 'youtube', utm_medium: 'organic', utm_campaign: null, vendas: 4, receita: 1188, ticket_medio: 297 },
  { utm_source: 'telegram', utm_medium: 'newsletter', utm_campaign: 'lista_vip', vendas: 3, receita: 891, ticket_medio: 297 },
  { utm_source: 'email', utm_medium: 'broadcast', utm_campaign: 'abertura_carrinho', vendas: 7, receita: 2079, ticket_medio: 297 },
];

const MOCK_ORGANIC_SALES = 10;

interface UTMLink {
  base_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
}

export default function UTMTracking() {
  const theme = useStore((s) => s.theme);
  const mode = useStore((s) => s.mode);
  const isMobile = useIsMobile();
  const c = theme === 'dark' ? COLORS : COLORS_LIGHT;

  const [utmData, setUtmData] = useState<UTMBreakdown[]>(MOCK_UTM);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'sources' | 'generator'>('sources');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [link, setLink] = useState<UTMLink>({
    base_url: '', utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '',
  });

  const organicSales = mode === 'demo' ? MOCK_ORGANIC_SALES : 0;
  const trackedVendas = utmData.reduce((s, u) => s + u.vendas, 0);
  const totalReceita = utmData.reduce((s, u) => s + u.receita, 0);

  useEffect(() => {
    if (mode === 'live') {
      getUTMBreakdown().then(setUtmData).catch(() => {});
    }
  }, [mode]);

  const filteredData = utmData.filter(u =>
    !searchQuery || [u.utm_source, u.utm_medium, u.utm_campaign].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group by source
  const bySource = filteredData.reduce((acc, u) => {
    const key = u.utm_source;
    if (!acc[key]) acc[key] = { vendas: 0, receita: 0, campaigns: [] as UTMBreakdown[] };
    acc[key].vendas += u.vendas;
    acc[key].receita += u.receita;
    acc[key].campaigns.push(u);
    return acc;
  }, {} as Record<string, { vendas: number; receita: number; campaigns: UTMBreakdown[] }>);

  function buildUrl(): string {
    if (!link.base_url) return '';
    try {
      const url = new URL(link.base_url.startsWith('http') ? link.base_url : `https://${link.base_url}`);
      if (link.utm_source) url.searchParams.set('utm_source', link.utm_source);
      if (link.utm_medium) url.searchParams.set('utm_medium', link.utm_medium);
      if (link.utm_campaign) url.searchParams.set('utm_campaign', link.utm_campaign);
      if (link.utm_content) url.searchParams.set('utm_content', link.utm_content);
      if (link.utm_term) url.searchParams.set('utm_term', link.utm_term);
      return url.toString();
    } catch {
      // Fallback for invalid URLs
      const params = new URLSearchParams();
      if (link.utm_source) params.set('utm_source', link.utm_source);
      if (link.utm_medium) params.set('utm_medium', link.utm_medium);
      if (link.utm_campaign) params.set('utm_campaign', link.utm_campaign);
      if (link.utm_content) params.set('utm_content', link.utm_content);
      if (link.utm_term) params.set('utm_term', link.utm_term);
      const sep = link.base_url.includes('?') ? '&' : '?';
      const paramStr = params.toString();
      return paramStr ? `${link.base_url}${sep}${paramStr}` : link.base_url;
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(buildUrl());
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  const SOURCE_COLORS: Record<string, string> = {
    facebook: '#1877F2', instagram: '#E4405F', google: '#4285F4',
    youtube: '#FF0000', telegram: '#26A5E4', email: '#f97316', tiktok: '#000000',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${c.info}, #2563eb)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Link size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk' }}>Rastreamento UTM</h1>
          <p style={{ fontSize: 13, color: c.textMuted }}>Atribuição de vendas por fonte de tráfego</p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Fontes Rastreadas', value: Object.keys(bySource).length.toString(), icon: Globe, color: c.accent },
          { label: 'Vendas com UTM', value: formatNumber(trackedVendas), icon: Tag, color: c.success },
          { label: 'Vendas Orgânicas', value: formatNumber(organicSales), icon: Hash, color: c.warning },
          { label: 'Receita Rastreada', value: formatCurrency(totalReceita), icon: BarChart3, color: c.info },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card"
            style={{ padding: 16, borderRadius: 14, background: c.surface2, border: `1px solid ${c.border}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{card.label}</span>
              <card.icon size={16} color={card.color} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.text, fontFamily: 'Space Grotesk' }}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: c.surface2, border: `1px solid ${c.border}` }}>
        {[
          { id: 'sources' as const, label: 'Fontes de Tráfego', icon: BarChart3 },
          { id: 'generator' as const, label: 'Gerador de Links', icon: Link },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? c.accent : 'transparent',
              color: activeTab === tab.id ? '#fff' : c.textMuted,
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sources Tab */}
      {activeTab === 'sources' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.textMuted }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por source, medium ou campaign..."
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 13 }}
            />
          </div>

          {/* Source bars */}
          {Object.entries(bySource)
            .sort(([, a], [, b]) => b.receita - a.receita)
            .map(([source, data], i) => {
              const pct = totalReceita > 0 ? (data.receita / totalReceita) * 100 : 0;
              const srcColor = SOURCE_COLORS[source] || c.accent;

              return (
                <motion.div
                  key={source}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card"
                  style={{ padding: 16, borderRadius: 14, background: c.surface2, border: `1px solid ${c.border}` }}
                >
                  {/* Source header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: srcColor }} />
                      <span style={{ fontSize: 15, fontWeight: 700, color: c.text, textTransform: 'capitalize' }}>{source}</span>
                      <span style={{ fontSize: 12, color: c.textMuted }}>{data.campaigns.length} campanhas</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: c.success, fontFamily: 'JetBrains Mono' }}>{formatCurrency(data.receita)}</span>
                      <span style={{ fontSize: 13, color: c.textSecondary }}>{data.vendas} vendas</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: srcColor }}>{pct.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div style={{ height: 6, borderRadius: 3, background: c.surface3, marginBottom: 12 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      style={{ height: '100%', borderRadius: 3, background: srcColor }}
                    />
                  </div>

                  {/* Campaign breakdown */}
                  {data.campaigns.length > 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, borderTop: `1px solid ${c.border}` }}>
                      {data.campaigns.map(camp => (
                        <div key={`${camp.utm_campaign}-${camp.utm_medium}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: c.textMuted }}>{camp.utm_medium || '—'}</span>
                            <span style={{ fontSize: 12, color: c.textSecondary }}>{camp.utm_campaign || 'sem campanha'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 12, color: c.text, fontFamily: 'JetBrains Mono' }}>{formatCurrency(camp.receita)}</span>
                            <span style={{ fontSize: 11, color: c.textMuted }}>{camp.vendas}v</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}

          {/* Organic */}
          {organicSales > 0 && (
            <div className="glass-card" style={{ padding: 16, borderRadius: 14, background: c.surface2, border: `1px dashed ${c.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.textMuted }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: c.textMuted }}>Orgânico / Direto</span>
                  <span style={{ fontSize: 12, color: c.textDim }}>sem UTM</span>
                </div>
                <span style={{ fontSize: 13, color: c.textMuted }}>{organicSales} vendas</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generator Tab */}
      {activeTab === 'generator' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ padding: 24, borderRadius: 16, background: c.surface2, border: `1px solid ${c.border}` }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link size={16} color={c.accent} /> Gerador de Links UTM
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
            {[
              { key: 'base_url' as const, label: 'URL de Destino *', placeholder: 'https://seusite.com/pagina-de-vendas', icon: ExternalLink },
              { key: 'utm_source' as const, label: 'utm_source *', placeholder: 'facebook, google, email', icon: Globe },
              { key: 'utm_medium' as const, label: 'utm_medium *', placeholder: 'cpc, organic, stories', icon: Filter },
              { key: 'utm_campaign' as const, label: 'utm_campaign', placeholder: 'lancamento_produto_v2', icon: Target },
              { key: 'utm_content' as const, label: 'utm_content', placeholder: 'video_depoimento_01', icon: Tag },
              { key: 'utm_term' as const, label: 'utm_term', placeholder: 'curso python online', icon: Hash },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <field.icon size={14} /> {field.label}
                </label>
                <input
                  value={link[field.key]}
                  onChange={e => setLink(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.surface3, color: c.text, fontSize: 13 }}
                />
              </div>
            ))}
          </div>

          {/* Preview */}
          {link.base_url && (
            <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: c.surface3, border: `1px solid ${c.borderActive}` }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: c.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' }}>URL Gerada</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <code style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: c.surface2, color: c.text, fontSize: 12, fontFamily: 'JetBrains Mono', wordBreak: 'break-all', lineHeight: 1.5 }}>
                  {buildUrl()}
                </code>
                <button
                  onClick={copyUrl}
                  style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: copiedUrl ? c.success : c.accent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                >
                  <Copy size={14} />
                  {copiedUrl ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
