import React from 'react';
import { setupIonicReact } from '@ionic/react';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import MainAppShell from './MainAppShell';
import ErrorBoundary from './components/ErrorBoundary';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

// Patch removeChild to prevent NotFoundError
if (typeof Node !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child: Node) {
    try {
      if (this.contains(child)) {
        return originalRemoveChild.call(this, child);
      }
      return child;
    } catch (e) {
      // Silently ignore removeChild errors
      return child;
    }
  };
}

// Initialize Ionic React components
setupIonicReact();

import { GoogleOAuthProvider } from '@react-oauth/google';

// Client ID Google OAuth (Disiapkan untuk Client ID yang sesungguhnya)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'GANTI_DENGAN_GOOGLE_CLIENT_ID_ANDA.apps.googleusercontent.com';

const App: React.FC = () => {
  // Prevent Google OAuth DOM conflicts
  const [oauthKey] = React.useState(() => Date.now());

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider key={oauthKey} clientId={GOOGLE_CLIENT_ID}>
        <NotificationProvider>
      <AppProvider>
          <MainAppShell />
        </AppProvider>
    </NotificationProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
};

export default App;
