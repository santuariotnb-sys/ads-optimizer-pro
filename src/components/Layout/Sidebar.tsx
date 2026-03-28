import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import {
  LayoutDashboard, Megaphone, Image, Radio, Users, Bell, Bot,
  GitBranch, PlusCircle, Zap, BookOpen, ChevronLeft, ChevronRight,
  Activity, X,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'campaigns', label: 'Campanhas', icon: Megaphone },
  { id: 'creatives', label: 'Criativos', icon: Image },
  { id: 'signal', label: 'Signal Engine', icon: Radio },
  { id: 'audiences', label: 'Públicos', icon: Users },
  { id: 'alerts', label: 'Alertas', icon: Bell, badge: true },
  { id: 'agent', label: 'Agente IA', icon: Bot },
  { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
  { id: 'create', label: 'Criar Campanha', icon: PlusCircle },
  { id: 'autoscale', label: 'Auto-Scale', icon: Zap },
  { id: 'playbook', label: 'Playbook', icon: BookOpen },
] as const;

const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';

export default function Sidebar() {
  const { currentModule, setCurrentModule, sidebarCollapsed, toggleSidebar, mode, alerts } = useStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const collapsed = sidebarCollapsed;
  const width = isMobile ? 280 : (collapsed ? 64 : 240);
  const undismissedAlerts = alerts.filter(a => !a.dismissed).length;

  const mobileHidden = isMobile && collapsed;
  const mobileVisible = isMobile && !collapsed;

  const handleNavClick = (id: string) => {
    setCurrentModule(id);
    if (isMobile) {
      toggleSidebar(); // close sidebar on mobile after nav click
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {mobileVisible && (
        <div
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99,
          }}
        />
      )}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width,
          background: 'rgba(12, 12, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          transition: isMobile ? `transform 0.3s ${easing}` : `width 0.3s ${easing}`,
          transform: mobileHidden ? 'translateX(-100%)' : 'translateX(0)',
          zIndex: isMobile ? 100 : 50,
          overflow: 'hidden',
        }}
      >
      {/* Logo */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0 12px' : '0 20px',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          transition: `padding 0.3s ${easing}`,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 20px rgba(99,102,241,0.3)',
          }}
        >
          <Activity size={20} color="#fff" strokeWidth={2.5} />
        </div>
        {(!collapsed || isMobile) && (
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e0e7ff, #a5b4fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.02em',
            }}
          >
            Ads Optimizer Pro
          </span>
        )}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            style={{
              marginLeft: 'auto',
              width: 44,
              height: 44,
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255,255,255,0.06)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
              outline: 'none',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: collapsed ? '12px 8px' : '12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          transition: `padding 0.3s ${easing}`,
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentModule === item.id;
          const isHovered = hoveredItem === item.id;
          const showBadge = 'badge' in item && item.badge && undismissedAlerts > 0;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 0' : '10px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                background: isActive
                  ? 'rgba(99,102,241,0.12)'
                  : isHovered
                  ? 'rgba(255,255,255,0.04)'
                  : 'transparent',
                borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
                transition: `all 0.2s ${easing}`,
                width: '100%',
                textAlign: 'left',
                outline: 'none',
                boxShadow: isActive
                  ? '0 0 20px rgba(99,102,241,0.08)'
                  : isHovered
                  ? '0 0 15px rgba(99,102,241,0.04)'
                  : 'none',
              }}
            >
              <Icon
                size={20}
                style={{
                  color: isActive ? '#a5b4fc' : isHovered ? '#c7d2fe' : 'rgba(255,255,255,0.45)',
                  flexShrink: 0,
                  transition: `color 0.2s ${easing}`,
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(99,102,241,0.5))' : 'none',
                }}
              />
              {!collapsed && (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#fff' : isHovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
                    whiteSpace: 'nowrap',
                    transition: `color 0.2s ${easing}`,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </span>
              )}
              {showBadge && (
                <span
                  style={{
                    position: collapsed ? 'absolute' : 'relative',
                    top: collapsed ? 6 : 'auto',
                    right: collapsed ? 6 : 'auto',
                    marginLeft: collapsed ? 0 : 'auto',
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                    boxShadow: '0 0 10px rgba(239,68,68,0.4)',
                  }}
                >
                  {undismissedAlerts}
                </span>
              )}
              {/* Tooltip on collapsed mode */}
              {collapsed && !isMobile && isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    left: '100%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    marginLeft: 8,
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(12,12,20,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e8f0',
                    fontSize: 12,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    zIndex: 200,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    pointerEvents: 'none',
                  }}
                >
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom section */}
      <div
        style={{
          padding: collapsed ? '16px 8px' : '16px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          flexShrink: 0,
          transition: `padding 0.3s ${easing}`,
        }}
      >
        {/* Mode indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: mode === 'live' ? 'rgba(34,197,94,0.08)' : 'rgba(234,179,8,0.08)',
            border: `1px solid ${mode === 'live' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)'}`,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: mode === 'live' ? '#22c55e' : '#eab308',
              boxShadow: `0 0 8px ${mode === 'live' ? 'rgba(34,197,94,0.6)' : 'rgba(234,179,8,0.6)'}`,
              animation: 'pulse-dot 2s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          {!collapsed && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: mode === 'live' ? '#4ade80' : '#facc15',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {mode === 'live' ? 'Live' : 'Demo'}
            </span>
          )}
        </div>

        {/* Version */}
        {!collapsed && (
          <span
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.2)',
              textAlign: 'center',
            }}
          >
            v1.0.0
          </span>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          style={{
            display: isMobile ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: collapsed ? 36 : '100%',
            height: 36,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)',
            transition: `all 0.2s ${easing}`,
            alignSelf: collapsed ? 'center' : 'stretch',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
      </nav>
    </>
  );
}
