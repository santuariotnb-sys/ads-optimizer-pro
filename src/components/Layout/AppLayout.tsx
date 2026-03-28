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
        background: '#0a0a0a',
        color: '#fafaf9',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
            width: 44,
            height: 44,
            borderRadius: 8,
            border: '1px solid rgba(255, 200, 120, 0.08)',
            background: '#1a1918',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a8a29e',
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
            padding: isMobile ? 16 : 28,
            overflowY: 'auto',
          }}
        >
          {children}
        </div>
      </main>

      {/* Subtle warm ambient glow */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse 600px 400px at 10% 10%, rgba(245, 158, 11, 0.03), transparent)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </div>
  );
}
