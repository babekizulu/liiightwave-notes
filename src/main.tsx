import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/literata/latin-400.css';
import '@fontsource/literata/latin-500.css';
import '@fontsource/literata/latin-400-italic.css';

import App from './App';
import AuthGate from './components/AuthGate';
import ErrorBoundary from './components/ErrorBoundary';
createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><AuthGate>{(user,onAccount)=><App user={user} onAccount={onAccount}/>}</AuthGate></ErrorBoundary></StrictMode>);
