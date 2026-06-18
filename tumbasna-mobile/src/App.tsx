import React from 'react';
import { setupIonicReact } from '@ionic/react';
import { AppProvider } from './context/AppContext';
import MainAppShell from './MainAppShell';

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

// Initialize Ionic React components
setupIonicReact();

const App: React.FC = () => (
  <AppProvider>
    <MainAppShell />
  </AppProvider>
);

export default App;
