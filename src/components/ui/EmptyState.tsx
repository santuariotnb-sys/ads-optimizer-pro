import { useStore } from '../../store/useStore';

interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
  actionLabel?: string;
  actionModule?: string;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionModule }: EmptyStateProps) {
  const setCurrentModule = useStore((s) => s.setCurrentModule);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'rgba(15,23,42,0.04)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
      }}>
        <Icon size={28} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#64748b', maxWidth: 360, margin: 0, lineHeight: 1.6 }}>{description}</p>
      {actionLabel && actionModule && (
        <button
          onClick={() => setCurrentModule(actionModule)}
          style={{
            marginTop: 20, padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
