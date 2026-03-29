import { useIsMobile } from '../../hooks/useMediaQuery';
import TopNav from './TopNav';
import CommandBar from './CommandBar';
import EverestBg from './EverestBg';
import { ToastContainer } from '../ui/Toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f8f6',
        color: '#0f172a',
        fontFamily: "'Plus Jakarta Sans', 'Outfit', system-ui, sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <EverestBg />
      <TopNav />
      <ToastContainer />

      <main
        style={{
          position: 'relative',
          zIndex: 10,
          paddingTop: 80,
          paddingBottom: 100,
          paddingLeft: isMobile ? 12 : 32,
          paddingRight: isMobile ? 12 : 32,
          maxWidth: 1680,
          margin: '0 auto',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>

      <CommandBar />
    </div>
  );
}
