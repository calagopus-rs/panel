import { useEffect } from 'react';
import { BrowserRouter } from 'react-router';
import getSettings from './api/getSettings.ts';
import Spinner from './elements/Spinner.tsx';
import { ToastProvider } from './providers/ToastProvider.tsx';
import { useGlobalStore } from './stores/global.ts';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import getLanguages from './api/getLanguages.ts';
import ErrorBoundary from './elements/ErrorBoundary.tsx';
import { CurrentWindowProvider } from './providers/CurrentWindowProvider.tsx';
import { WindowProvider } from './providers/WindowProvider.tsx';
import RouterRoutes from './RouterRoutes.tsx';

export default function App() {
  const { settings, setSettings, setLanguages } = useGlobalStore();

  useEffect(() => {
    Promise.all([getSettings(), getLanguages()]).then(([settings, languages]) => {
      setSettings(settings);
      setLanguages(languages);
    });
  }, []);

  return Object.keys(settings).length > 0 ? (
    <ErrorBoundary>
      <MantineProvider forceColorScheme='dark'>
        <ToastProvider>
          <WindowProvider>
            <CurrentWindowProvider id={null}>
              <BrowserRouter>
                <RouterRoutes isNormal />
              </BrowserRouter>
            </CurrentWindowProvider>
          </WindowProvider>
        </ToastProvider>
      </MantineProvider>
    </ErrorBoundary>
  ) : (
    <Spinner.Centered />
  );
}
