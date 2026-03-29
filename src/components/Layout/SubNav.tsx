import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface SubNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface SubNavProps {
  items: SubNavItem[];
}

export default function SubNav({ items }: SubNavProps) {
  const currentModule = useStore((s) => s.currentModule);
  const setCurrentModule = useStore((s) => s.setCurrentModule);
  const isMobile = useIsMobile();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (isMobile) {
    // Mobile: horizontal scrollable pills at top
    return (
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '12px 12px 8px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          borderBottom: '1px solid rgba(15,23,42,0.06)',
        }}
      >
        {items.map((item) => {
          const isActive = currentModule === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentModule(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10, border: 'none',
                background: isActive ? 'rgba(15,23,42,0.06)' : 'transparent',
                color: isActive ? '#0f172a' : '#64748b',
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
      </div>
    );
  }

  // Desktop: vertical sidebar
  return (
    <nav
      style={{
        width: 220,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '20px 12px',
        borderRight: '1px solid rgba(15,23,42,0.06)',
        background: 'rgba(255,255,255,0.3)',
        backdropFilter: 'blur(20px)',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      {items.map((item) => {
        const isActive = currentModule === item.id;
        const isHovered = hoveredId === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => setCurrentModule(item.id)}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 12,
              border: 'none',
              background: isActive
                ? 'rgba(15,23,42,0.06)'
                : isHovered
                  ? 'rgba(15,23,42,0.03)'
                  : 'transparent',
              borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
              color: isActive ? '#0f172a' : '#64748b',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13.5,
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
