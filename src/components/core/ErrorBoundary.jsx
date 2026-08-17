import React from 'react';
import { RefreshCw, AlertTriangle } from '@utils/icons';
import { Button } from '@components/ui';

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

    reset = () => {
        this.setState({ hasError: false, error: null });
    };

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
                    <AlertTriangle size={48} color="var(--error)" style={{ marginBottom: '20px' }} />
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Something went wrong</h1>
                    <p style={{ color: '#94a3b8', marginBottom: '20px', maxWidth: '400px' }}>
                        An unexpected error occurred while rendering this view. It has been logged; try again or reload the app.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button
                            onClick={this.reset}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            Try Again
                        </Button>
                        <Button
                            onClick={() => window.location.reload()}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <RefreshCw size={18} />
                            Reload App
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
