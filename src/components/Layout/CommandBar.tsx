import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { LayoutDashboard, Target, Radio, Link, Palette } from 'lucide-react';
import { motion } from 'motion/react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  module: string;
}

const actions: QuickAction[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, module: 'opt-overview' },
  { id: 'campanhas', label: 'Campanhas', icon: Target, module: 'opt-campaigns' },
  { id: 'signal', label: 'Signal', icon: Radio, module: 'opt-signal' },
  { id: 'utm', label: 'UTM', icon: Link, module: 'utm-dashboard' },
  { id: 'criativos', label: 'Criativos', icon: Palette, module: 'cre-dashboard' },
];

function LiveClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');

  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        fontWeight: 500,
        color: '#475569',
        letterSpacing: '0.04em',
        minWidth: 62,
        textAlign: 'center',
      }}
    >
      {hh}:{mm}:{ss}
    </span>
  );
}

export default function CommandBar() {
  const { currentModule, setCurrentModule } = useStore();
  const isMobile = useIsMobile();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed',
        bottom: isMobile ? 12 : 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        background: 'rgba(255,255,255,.38)',
        backdropFilter: 'blur(32px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,.55)',
        boxShadow: '0 8px 32px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.04)',
      }}
    >
      {/* Logo */}
      <img
        src="/logo-everest.png"
        alt="Ads.Everest"
        style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
      />

      {/* Separator */}
      <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,.10)', flexShrink: 0 }} />

      {/* Quick actions */}
      {actions.map((action) => {
        const prefix = action.module.split('-')[0];
        const highlighted = currentModule.startsWith(prefix + '-');
        const isHovered = hoveredId === action.id;
        const Icon = action.icon;

        return (
          <button
            key={action.id}
            onClick={() => setCurrentModule(action.module)}
            onMouseEnter={() => setHoveredId(action.id)}
            onMouseLeave={() => setHoveredId(null)}
            title={action.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: isMobile ? '6px 8px' : '6px 12px',
              borderRadius: 10,
              border: highlighted ? '1px solid rgba(255,255,255,.65)' : '1px solid transparent',
              background: highlighted
                ? 'rgba(255,255,255,.50)'
                : isHovered
                  ? 'rgba(255,255,255,.20)'
                  : 'transparent',
              color: highlighted ? '#0f172a' : '#64748b',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              flexShrink: 0,
            }}
          >
            <Icon size={16} />
            {!isMobile && action.label}
          </button>
        );
      })}

      {/* Separator */}
      <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,.10)', flexShrink: 0 }} />

      {/* Live clock */}
      <LiveClock />
    </motion.div>
  );
}
