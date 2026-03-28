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
          minHeight: '100vh', background: '#0a0a0a', color: '#f5f5f5', fontFamily: "'DM Sans', sans-serif",
          padding: 32, textAlign: 'center',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0a0a0a 0%, #060606 100%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 20,
            padding: 40, maxWidth: 480,
            boxShadow: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.2) inset, 0 4px 16px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.25)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Algo deu errado
            </h1>
            <p style={{ color: '#a3a3a3', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              {this.state.error?.message || 'Ocorreu um erro inesperado.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); }}
              style={{
                background: 'linear-gradient(135deg, #10b981, #34d399)', color: 'white',
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
