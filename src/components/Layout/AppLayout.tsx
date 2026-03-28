import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import Sidebar from './Sidebar';
import Header from './Header';
import { Menu } from 'lucide-react';

const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleSidebar } = useStore();
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#0c0c14',
        color: '#fff',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <Sidebar />

      {/* Mobile hamburger button */}
      {isMobile && sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 14,
            left: 12,
            zIndex: 90,
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(12, 12, 20, 0.9)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.7)',
            outline: 'none',
          }}
        >
          <Menu size={20} />
        </button>
      )}

      <main
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 64 : 240),
          transition: `margin-left 0.3s ${easing}`,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Header />

        <div
          style={{
            flex: 1,
            padding: isMobile ? 16 : 24,
            overflowY: 'auto',
          }}
        >
          {children}
        </div>
      </main>

      {/* Ambient background glow */}
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          left: '30%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-10%',
          right: '10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </div>
  );
}
