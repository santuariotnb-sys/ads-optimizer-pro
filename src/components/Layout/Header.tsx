import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Search, Settings, Wifi, WifiOff } from 'lucide-react';
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
      style={{
        height: isMobile ? 'auto' : 64,
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        padding: isMobile ? '12px 16px' : '0 24px',
        gap: isMobile ? 12 : 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      {/* Left: Title */}
      <h1
        style={{
          fontSize: isMobile ? 16 : 20,
          fontWeight: 700,
          color: '#fff',
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
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
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
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))'
                    : 'transparent',
                  boxShadow: isActive ? '0 0 16px rgba(99,102,241,0.2)' : 'none',
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
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />

        {/* Connect / Account */}
        {mode === 'demo' ? (
          <button
            onClick={() => {
              /* Connect Meta flow placeholder */
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(99,102,241,0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid rgba(99,102,241,0.3)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))',
              color: '#c7d2fe',
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
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.15)',
            }}
          >
            <Wifi size={15} style={{ color: '#4ade80' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>Meta Conectado</span>
          </div>
        )}

        {/* Divider - hidden on mobile */}
        {!isMobile && (
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />
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
              border: '1px solid rgba(255,255,255,0.06)',
              background: hoveredIcon === 'search' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: hoveredIcon === 'search' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
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
              border: '1px solid rgba(255,255,255,0.06)',
              background: hoveredIcon === 'settings' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: hoveredIcon === 'settings' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
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
