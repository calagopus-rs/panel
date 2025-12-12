import { useEffect } from 'react';
import { BrowserRouter } from 'react-router';
import getSettings from './api/getSettings';
import Spinner from './elements/Spinner';
import { ToastProvider } from './providers/ToastProvider';
import { useGlobalStore } from './stores/global';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import getLanguages from './api/getLanguages';
import ErrorBoundary from './elements/ErrorBoundary';
import { CurrentWindowProvider } from './providers/CurrentWindowProvider';
import { WindowProvider } from './providers/WindowProvider';
import RouterRoutes from './RouterRoutes';

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
