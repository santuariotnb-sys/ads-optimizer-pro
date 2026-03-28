import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', background: '#0c0c14', color: '#e2e8f0', fontFamily: "'Outfit', sans-serif",
          padding: 32, textAlign: 'center',
        }}>
          <div style={{
            background: 'rgba(22,22,32,0.85)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16,
            padding: 40, maxWidth: 480,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
              Algo deu errado
            </h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              {this.state.error?.message || 'Ocorreu um erro inesperado.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); }}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14,
                fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
