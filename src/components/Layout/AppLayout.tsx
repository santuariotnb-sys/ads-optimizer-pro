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
        background: '#000000',
        color: '#f5f5f5',
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
            border: '1px solid rgba(255, 255, 255, 0.05)',
            background: '#111111',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#737373',
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
    </div>
  );
}
