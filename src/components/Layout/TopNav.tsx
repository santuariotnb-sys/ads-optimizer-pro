import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, Link, Sparkles, Bell, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabId = 'cmd' | 'trace' | 'cre';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  defaultModule: string;
}

const tabs: TabDef[] = [
  { id: 'cmd', label: 'COMANDO', icon: LayoutDashboard, defaultModule: 'cmd-overview' },
  { id: 'trace', label: 'XTRACKER', icon: Link, defaultModule: 'trace-dashboard' },
  { id: 'cre', label: 'CRIATIVOS', icon: Sparkles, defaultModule: 'cre-dashboard' },
];

function getActiveTab(currentModule: string): TabId {
  if (currentModule.startsWith('trace-') || currentModule.startsWith('utm-') || currentModule.startsWith('meta-') || currentModule.startsWith('google-') || currentModule.startsWith('tiktok-') || currentModule.startsWith('kwai-') || currentModule.startsWith('integ-')) return 'trace';
  if (currentModule.startsWith('cre-')) return 'cre';
  if (currentModule.startsWith('opt-')) return 'cmd'; // backward compat
  return 'cmd';
}

export default function TopNav() {
  const currentModule = useStore((s) => s.currentModule);
  const setCurrentModule = useStore((s) => s.setCurrentModule);
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const alerts = useStore((s) => s.alerts);
  const [bellOpen, setBellOpen] = useState(false);

  const [userName, setUserName] = useState('Usuário');
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.full_name) setUserName(data.user.user_metadata.full_name);
      else if (data.user?.email) setUserName(data.user.email.split('@')[0]);
    }).catch(() => {});
  }, []);
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const activeTab = getActiveTab(currentModule);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 12px' : '0 24px',
          background: 'rgba(255,255,255,.38)',
          backdropFilter: 'blur(32px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
          borderBottom: '1px solid rgba(15,23,42,0.08)',
        }}
      >
        {/* Logo */}
        <div
          onClick={() => setCurrentModule('cmd-overview')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: isMobile ? 'auto' : 220, cursor: 'pointer' }}
        >
          <img
            src="/logo-everest.png"
            alt="Ads.Everest"
            style={{
              width: isMobile ? 43 : 80,
              height: isMobile ? 43 : 80,
              borderRadius: isMobile ? 12 : 20,
              objectFit: 'cover',
              filter: 'drop-shadow(0 8px 22px rgba(15,23,42,0.22))',
              animation: 'logoFloat 4s ease-in-out infinite',
            }}
          />
          <style>{`@keyframes logoFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }`}</style>
          {!isMobile && (
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
              <span style={{ color: '#0f172a' }}>Ads</span>
              <span style={{ color: '#b8854c' }}>.Everest</span>
            </span>
          )}
        </div>

        {/* Center tabs — desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 4, background: 'rgba(255,255,255,.08)', borderRadius: 16 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isHovered = hoveredTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentModule(tab.defaultModule)}
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 18px',
                    borderRadius: 12,
                    border: isActive ? '1px solid rgba(255,255,255,.72)' : '1px solid transparent',
                    background: isActive
                      ? 'rgba(255,255,255,.60)'
                      : isHovered
                        ? 'rgba(255,255,255,.18)'
                        : 'transparent',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,.06)' : 'none',
                    color: isActive ? '#0f172a' : '#64748b',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentModule(tab.defaultModule)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    border: isActive ? '1px solid rgba(255,255,255,.72)' : '1px solid transparent',
                    background: isActive ? 'rgba(255,255,255,.60)' : 'transparent',
                    color: isActive ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, minWidth: isMobile ? 'auto' : 180, justifyContent: 'flex-end' }}>
          {/* Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,.30)',
                background: bellOpen ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.12)',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              <Bell size={18} />
              {alerts.filter(a => !a.dismissed).length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '2px solid rgba(255,255,255,.80)',
                  }}
                />
              )}
            </button>
            {bellOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 44,
                  right: 0,
                  width: 280,
                  background: 'rgba(255,255,255,.82)',
                  backdropFilter: 'blur(28px) saturate(1.6)',
                  WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
                  border: '1px solid rgba(255,255,255,.55)',
                  borderRadius: 14,
                  boxShadow: '0 12px 40px rgba(15,23,42,.16)',
                  padding: 10,
                  zIndex: 200,
                }}
              >
                {alerts.length === 0 ? (
                  <div style={{ padding: '14px 10px', fontSize: 13, color: '#64748b', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
                    Nenhuma notificação nova
                  </div>
                ) : (
                  alerts.filter(a => !a.dismissed).slice(0, 3).map((a) => (
                    <div key={a.id} style={{ padding: '8px 10px', borderRadius: 8, marginBottom: 2, background: 'rgba(15,23,42,.03)' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2, fontFamily: "'Outfit', sans-serif" }}>
                        {a.type}
                      </div>
                      <div style={{ fontSize: 12, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                        {a.title}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User avatar */}
          <button
            onClick={() => setCurrentModule('cmd-settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 4px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,.30)',
              background: 'rgba(255,255,255,.12)',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1e293b, #334155)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {userInitials}
            </div>
            {!isMobile && (
              <span
                style={{
                  color: '#334155',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  paddingRight: 8,
                }}
              >
                {userName}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,.30)',
                background: 'rgba(255,255,255,.12)',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 64,
              left: 0,
              right: 0,
              zIndex: 99,
              padding: 12,
              background: 'rgba(255,255,255,.85)',
              backdropFilter: 'blur(32px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
              borderBottom: '1px solid rgba(255,255,255,.55)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentModule(tab.defaultModule);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: isActive ? '1px solid rgba(255,255,255,.72)' : '1px solid transparent',
                    background: isActive ? 'rgba(255,255,255,.60)' : 'transparent',
                    color: isActive ? '#0f172a' : '#64748b',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
