import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Search, Settings, Wifi, WifiOff } from 'lucide-react';
import { openMetaLogin } from '../../services/metaAuth';
import type { Period } from '../../types/meta';

const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';

const moduleTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  campaigns: 'Campanhas',
  creatives: 'Criativos',
  signal: 'Signal Engine',
  audiences: 'Públicos',
  alerts: 'Alertas',
  agent: 'Agente IA',
  pipeline: 'Pipeline',
  create: 'Criar Campanha',
  autoscale: 'Auto-Scale',
  playbook: 'Playbook',
};

const periods: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7d' },
  { value: '14d', label: '14d' },
  { value: '30d', label: '30d' },
];

export default function Header() {
  const { currentModule, selectedPeriod, setSelectedPeriod, mode } = useStore();
  const [hoveredPeriod, setHoveredPeriod] = useState<string | null>(null);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const title = moduleTitles[currentModule] || 'Dashboard';

  return (
    <header
      role="banner"
      style={{
        height: isMobile ? 'auto' : 64,
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        padding: isMobile ? '12px 16px' : '0 24px',
        gap: isMobile ? 12 : 0,
        background: 'transparent',
        borderBottom: '1px solid rgba(255, 200, 120, 0.04)',
        flexShrink: 0,
      }}
    >
      {/* Left: Title */}
      <h1
        style={{
          fontSize: isMobile ? 16 : 20,
          fontFamily: "'Sora', sans-serif",
          fontWeight: 700,
          color: '#fafaf9',
          letterSpacing: '-0.02em',
          margin: 0,
          paddingLeft: isMobile ? 40 : 0,
        }}
      >
        {title}
      </h1>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: isMobile ? '100%' : 'auto' }}>
        {/* Period selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: 3,
            borderRadius: 10,
            background: 'linear-gradient(145deg, #1a1918 0%, #151413 100%)',
            border: '1px solid rgba(255, 200, 120, 0.06)',
            overflowX: isMobile ? 'auto' : 'visible',
            flexWrap: 'nowrap',
            flexShrink: isMobile ? 1 : 0,
          }}
        >
          {periods.map((p) => {
            const isActive = selectedPeriod === p.value;
            const isHovered = hoveredPeriod === p.value;

            return (
              <button
                key={p.value}
                onClick={() => setSelectedPeriod(p.value)}
                onMouseEnter={() => setHoveredPeriod(p.value)}
                onMouseLeave={() => setHoveredPeriod(null)}
                aria-label={`Período: ${p.label}`}
                aria-pressed={selectedPeriod === p.value}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fafaf9' : isHovered ? '#d6d3d1' : '#a8a29e',
                  background: isActive
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'transparent',
                  boxShadow: isActive
                    ? '0 1px 0 0 rgba(255, 200, 120, 0.05) inset, 0 -1px 0 0 rgba(0, 0, 0, 0.15) inset, 0 0 16px rgba(245, 158, 11, 0.15)'
                    : '0 1px 0 0 rgba(255, 200, 120, 0.05) inset, 0 -1px 0 0 rgba(0, 0, 0, 0.15) inset',
                  transition: `all 0.2s ${easing}`,
                  outline: 'none',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'rgba(255, 200, 120, 0.06)' }} />

        {/* Connect / Account */}
        {mode === 'demo' ? (
          <button
            onClick={() => {
              openMetaLogin();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.25)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 12px rgba(245, 158, 11, 0.1)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid rgba(245, 158, 11, 0.3)',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fafaf9',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: `all 0.2s ${easing}`,
              outline: 'none',
            }}
          >
            <WifiOff size={15} />
            Conectar Meta
          </button>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(132, 204, 22, 0.08)',
              border: '1px solid rgba(132, 204, 22, 0.15)',
            }}
          >
            <Wifi size={15} style={{ color: '#84cc16' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#84cc16' }}>Meta Conectado</span>
          </div>
        )}

        {/* Divider - hidden on mobile */}
        {!isMobile && (
          <div style={{ width: 1, height: 24, background: 'rgba(255, 200, 120, 0.06)' }} />
        )}

        {/* Search icon - hidden on mobile */}
        {!isMobile && (
          <button
            onMouseEnter={() => setHoveredIcon('search')}
            onMouseLeave={() => setHoveredIcon(null)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid rgba(255, 200, 120, 0.06)',
              background: hoveredIcon === 'search' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 200, 120, 0.03)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: hoveredIcon === 'search' ? '#d6d3d1' : '#a8a29e',
              transition: `all 0.2s ${easing}`,
              outline: 'none',
            }}
          >
            <Search size={16} />
          </button>
        )}

        {/* Settings icon - hidden on mobile */}
        {!isMobile && (
          <button
            onMouseEnter={() => setHoveredIcon('settings')}
            onMouseLeave={() => setHoveredIcon(null)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid rgba(255, 200, 120, 0.06)',
              background: hoveredIcon === 'settings' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 200, 120, 0.03)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: hoveredIcon === 'settings' ? '#d6d3d1' : '#a8a29e',
              transition: `all 0.2s ${easing}`,
              outline: 'none',
            }}
          >
            <Settings size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
