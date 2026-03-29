import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';

export default function NotificationBell() {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const [hovered, setHovered] = useState(false);

  if (!isSupported) return null;

  const isDenied = permission === 'denied';
  const active = isSubscribed && !isDenied;

  return (
    <button
      onClick={() => {
        if (isDenied) return;
        if (isSubscribed) unsubscribe();
        else subscribe();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={active ? 'Desativar notificações push' : 'Ativar notificações push'}
      title={isDenied ? 'Notificações bloqueadas pelo navegador' : active ? 'Notificações ativas' : 'Ativar notificações'}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        border: `1px solid ${active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
        background: active
          ? hovered ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)'
          : hovered ? 'rgba(99, 102, 241, 0.06)' : 'rgba(255, 255, 255, 0.02)',
        cursor: isDenied ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDenied ? '#525252' : active ? '#6366f1' : hovered ? '#a3a3a3' : '#737373',
        transition: `all 0.2s ${easing}`,
        outline: 'none',
        position: 'relative',
        opacity: isDenied ? 0.5 : 1,
      }}
    >
      {isLoading ? (
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
      ) : active ? (
        <>
          <Bell size={16} />
          <div
            style={{
              position: 'absolute',
              top: 7,
              right: 8,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#6366f1',
              boxShadow: '0 0 6px rgba(99, 102, 241, 0.4)',
            }}
          />
        </>
      ) : (
        <BellOff size={16} />
      )}
    </button>
  );
}
