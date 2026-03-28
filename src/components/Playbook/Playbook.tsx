import { useState } from 'react';
import { BookOpen, TrendingUp, ExternalLink, ChevronDown, ChevronUp, Layers, Radio, Megaphone, Cpu } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

type Category = 'Todos' | 'Criativos' | 'CAPI' | 'Campanhas' | 'Algoritmo';

interface Entry {
  id: number;
  title: string;
  category: 'Criativos' | 'CAPI' | 'Campanhas' | 'Algoritmo';
  content: string;
  source: string;
  impact: string;
}

const entries: Entry[] = [
  { id: 1, title: 'Entity ID: Diversifique seus criativos', category: 'Criativos', content: 'O Andromeda agrupa criativos com >60% de similaridade visual sob o mesmo Entity ID. Cada Entity ID = 1 ticket no leilão. Ter 10 criativos mas 3 Entity IDs significa apenas 3 chances no leilão.', source: 'Confect.io — 3.014 anunciantes, $834M ad spend', impact: 'Vero Moda: +60% vendas' },
  { id: 2, title: 'Novelty Bias: CPM dobra em 7 dias', category: 'Criativos', content: 'O Meta favorece criativos novos com CPM mais baixo. Após 7 dias, o CPM pode dobrar. Refresh criativos a cada 7-10 dias para manter custos baixos.', source: 'Dark community data', impact: 'CPM -40% com refresh constante' },
  { id: 3, title: 'Signal Engineering Nível 4', category: 'CAPI', content: 'Envie predicted_ltv, margin_tier e engagement_score via CAPI. Apenas 0.3% dos anunciantes fazem isso. Ensina o Andromeda a encontrar compradores de alto valor.', source: 'CustomerLabs, Hightouch, AdZeta', impact: 'CPA -11% (EMQ 5.2→8.4)' },
  { id: 4, title: 'CAPI: -13% CPA e +19% compras', category: 'CAPI', content: 'Implementar CAPI corretamente com deduplicação via event_id entre pixel e CAPI. EMQ ideal: 8.0+.', source: 'Meta Business Help Center', impact: '-13% CPA, +19% compras' },
  { id: 5, title: 'Advantage+ Sales: +22% ROAS', category: 'Campanhas', content: 'Use ASC com machine learning completo. Não adicione interesses manuais. Use CBO com 6+ criativos por ad set.', source: 'Meta — dados oficiais Q4 2024', impact: '+22% ROAS' },
  { id: 6, title: 'First Conversion vs All Conversions', category: 'Campanhas', content: 'Use First Conversion como attribution. All Conversions infla números e confunde o algoritmo.', source: 'Meta Ads best practices', impact: 'Dados mais precisos' },
  { id: 7, title: 'GEM: +5% conv IG, +3% FB', category: 'Algoritmo', content: 'O GEM é o maior foundation model de recomendação do mundo (escala GPT-4). Ativo desde Q2 2025 sem opt-in. Aprende cross-platform.', source: 'Meta Engineering Blog Q2 2025', impact: '+5% conv IG, +3% FB Feed' },
  { id: 8, title: 'MTIA v2: Hardware de IA do Meta', category: 'Algoritmo', content: 'O Meta usa MTIA v2 (5nm, 7× sparse compute, 256MB SRAM, 2.7TB/s) para retrieval em <200ms de 1B+ ads.', source: 'Meta Engineering Blog, NVIDIA', impact: 'Leilões mais inteligentes' },
  { id: 9, title: 'Synthetic Events: Nível Alien', category: 'CAPI', content: 'Crie DeepEngagement, HighIntentVisitor, QualifiedLead via CAPI. Ensina comportamentos pré-compra ao Andromeda. Apenas 0.01% fazem isso.', source: 'CustomerLabs/AdZeta', impact: 'CPA significativamente menor' },
  { id: 10, title: 'Value Rules: +46% ROAS', category: 'Campanhas', content: 'Use Value Rules para indicar que first-time purchasers valem mais. Laura Geller obteve +46% ROAS.', source: 'Laura Geller case study — Meta', impact: '+46% ROAS' },
];

const categoryColors: Record<string, string> = {
  Criativos: '#f97316',
  CAPI: '#10b981',
  Campanhas: '#22c55e',
  Algoritmo: '#06b6d4',
};

const categoryIcons: Record<string, React.ReactNode> = {
  Todos: <BookOpen size={16} />,
  Criativos: <Layers size={16} />,
  CAPI: <Radio size={16} />,
  Campanhas: <Megaphone size={16} />,
  Algoritmo: <Cpu size={16} />,
};

const categories: Category[] = ['Todos', 'Criativos', 'CAPI', 'Campanhas', 'Algoritmo'];

const glassCard: React.CSSProperties = {
  background: 'linear-gradient(145deg, #0a0a0a 0%, #060606 100%)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 20,
  boxShadow: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.2) inset, 0 4px 16px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.25)',
};

export default function Playbook() {
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState<Category>('Todos');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [hoveredEntry, setHoveredEntry] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredEntries = activeCategory === 'Todos'
    ? entries
    : entries.filter(e => e.category === activeCategory);

  const getCategoryCount = (cat: Category) => {
    if (cat === 'Todos') return entries.length;
    return entries.filter(e => e.category === cat).length;
  };

  return (
    <div style={{
      color: '#f5f5f5',
    }}>
      <div style={{ maxWidth: isMobile ? '100%' : 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <BookOpen size={28} color="#10b981" />
          <h1 style={{
            fontSize: 28, fontWeight: 700, margin: 0,
            background: 'linear-gradient(135deg, #f5f5f5, #10b981)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Playbook</h1>
        </div>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32 }}>
          Base de conhecimento com as melhores práticas para Meta Ads
        </p>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: isMobile ? 20 : 28, flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch', paddingBottom: isMobile ? 4 : 0 }}>
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            const color = cat === 'Todos' ? '#10b981' : categoryColors[cat];
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap',
                padding: isMobile ? '8px 14px' : '10px 18px',
                background: isActive ? `${color}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10, color: isActive ? color : '#a3a3a3',
                cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s',
              }}>
                {categoryIcons[cat]}
                {cat}
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                  background: isActive ? `${color}30` : 'rgba(255,255,255,0.06)',
                  color: isActive ? color : '#475569',
                }}>{getCategoryCount(cat)}</span>
              </button>
            );
          })}
        </div>

        {/* Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredEntries.map(entry => {
            const isExpanded = expandedIds.has(entry.id);
            const color = categoryColors[entry.category];
            const truncated = entry.content.length > 100
              ? entry.content.slice(0, 100) + '...'
              : entry.content;

            return (
              <div
                key={entry.id}
                onClick={() => toggleExpand(entry.id)}
                onMouseEnter={() => setHoveredEntry(entry.id)}
                onMouseLeave={() => setHoveredEntry(null)}
                style={{
                  ...glassCard,
                  borderLeft: `3px solid ${color}`,
                  borderColor: hoveredEntry === entry.id ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
                  padding: isMobile ? '14px 16px' : '20px 24px',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: hoveredEntry === entry.id ? '0 0 30px rgba(16,185,129,0.06)' : 'none',
                  transform: hoveredEntry === entry.id ? 'translateY(-1px)' : 'translateY(0)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{entry.title}</h3>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: `${color}20`, color: color, letterSpacing: '0.3px',
                    }}>{entry.category}</span>
                  </div>
                  {isExpanded
                    ? <ChevronUp size={18} color="#a3a3a3" />
                    : <ChevronDown size={18} color="#a3a3a3" />
                  }
                </div>

                {/* Content */}
                <p style={{
                  fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: 0,
                  transition: 'all 0.3s',
                }}>
                  {isExpanded ? entry.content : truncated}
                </p>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#a3a3a3' }}>
                      <ExternalLink size={14} />
                      <span style={{ fontFamily: "'JetBrains Mono', 'JetBrains Mono', monospace" }}>
                        {entry.source}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10,
                    }}>
                      <TrendingUp size={16} color="#22c55e" />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>{entry.impact}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredEntries.length === 0 && (
            <div style={{
              ...glassCard, padding: 40, textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, color: '#a3a3a3' }}>Nenhum item nesta categoria</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
