import TopNav from './TopNav';
import CommandBar from './CommandBar';
import EverestBg from './EverestBg';
import { ToastContainer } from '../ui/Toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {

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

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          paddingTop: 64,
          minHeight: '100vh',
        }}
      >
        {/* Sidebar rendered by App.tsx via children */}
        {children}
      </div>

      <CommandBar />
    </div>
  );
}
