import { useState, useRef } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: 4,
        background: 'rgba(15,23,42,0.03)',
        borderRadius: 16,
        borderBottom: '1px solid rgba(15,23,42,0.06)',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexWrap: 'nowrap',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
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
              gap: 6,
              padding: isMobile ? '6px 12px' : '7px 16px',
              borderRadius: 12,
              border: isActive ? '1px solid rgba(15,23,42,0.12)' : '1px solid transparent',
              background: isActive
                ? 'rgba(15,23,42,0.06)'
                : isHovered
                  ? 'rgba(15,23,42,0.04)'
                  : 'transparent',
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,.05)' : 'none',
              color: isActive ? '#0f172a' : '#475569',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13.5,
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <Icon size={15} />
            {item.label}
          </button>
        );
      })}

      {/* Hide scrollbar via inline style tag */}
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
