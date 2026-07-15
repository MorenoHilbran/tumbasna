import React, { Component, ErrorInfo, ReactNode } from 'react';
import { IonPage, IonContent, IonButton } from '@ionic/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Filter out extension and DOM manipulation errors
    const errorMessage = error.message || '';
    const errorStack = error.stack || '';
    
    if (
      errorMessage.includes('removeChild') ||
      errorMessage.includes('Message ID') ||
      errorMessage.includes('already has a listener') ||
      errorStack.includes('content-all.js') ||
      errorStack.includes('chrome-extension') ||
      errorStack.includes('moz-extension') ||
      error.name === 'NotFoundError'
    ) {
      // Don't show error UI for extension/DOM errors
      console.warn('[Suppressed Extension/DOM Error]:', errorMessage);
      return { hasError: false };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Filter extension and DOM errors
    const errorMessage = error.message || '';
    const errorStack = error.stack || '';
    
    if (
      errorMessage.includes('removeChild') ||
      errorMessage.includes('Message ID') ||
      errorStack.includes('content-all.js') ||
      errorStack.includes('chrome-extension') ||
      error.name === 'NotFoundError'
    ) {
      return; // Ignore extension/DOM errors
    }
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <IonPage>
          <IonContent className="ion-padding ion-text-center">
            <div style={{ marginTop: '40%' }}>
              <h2>Oops! Terjadi Kesalahan</h2>
              <p style={{ color: '#666', margin: '20px 0' }}>
                Aplikasi mengalami error. Silakan muat ulang halaman.
              </p>
              <IonButton onClick={() => window.location.reload()}>
                Muat Ulang
              </IonButton>
            </div>
          </IonContent>
        </IonPage>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
