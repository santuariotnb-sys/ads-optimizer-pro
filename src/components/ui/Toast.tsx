import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { getToasts, dismissToast, subscribe, type Toast } from './toastStore';

/* ── Hook ── */

function useToasts(): Toast[] {
  const [, setTick] = useState(0);

  useEffect(() => {
    return subscribe(() => setTick((t) => t + 1));
  }, []);

  return getToasts();
}

/* ── Styling ── */

type ToastType = 'success' | 'error' | 'info' | 'warning';

const typeConfig: Record<ToastType, { color: string; icon: typeof CheckCircle }> = {
  success: { color: '#10b981', icon: CheckCircle },
  error:   { color: '#ef4444', icon: XCircle },
  warning: { color: '#f59e0b', icon: AlertTriangle },
  info:    { color: '#6366f1', icon: Info },
};

/* ── Component ── */

export function ToastContainer() {
  const items = useToasts();

  const dismiss = useCallback((id: string) => {
    dismissToast(id);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {items.map((toast) => {
        const cfg = typeConfig[toast.type];
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(20px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)',
              minWidth: 280,
              maxWidth: 380,
              animation: 'toastSlideIn 0.3s cubic-bezier(0.4,0,0.2,1)',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <Icon size={18} style={{ color: cfg.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#0f172a', lineHeight: 1.4 }}>
              {toast.message}
            </span>
            <button
              onClick={() => dismiss(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: 2,
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
