import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    background: '#0f172a',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '20px' }} />
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Something went wrong</h1>
                    <p style={{ color: '#94a3b8', marginBottom: '20px', maxWidth: '400px' }}>
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={18} />
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
