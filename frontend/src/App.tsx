import { useEffect } from 'react';
import { BrowserRouter } from 'react-router';
import getSettings from './api/getSettings';
import Spinner from './elements/Spinner';
import { ToastProvider } from './providers/ToastProvider';
import { useGlobalStore } from './stores/global';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import ErrorBoundary from './elements/ErrorBoundary';
import { WindowProvider } from './providers/WindowProvider';
import RouterRoutes from './RouterRoutes';

export default function App() {
  const { settings, setSettings } = useGlobalStore();

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  return settings ? (
    <ErrorBoundary>
      <MantineProvider forceColorScheme='dark'>
        <ToastProvider>
          <WindowProvider>
            <BrowserRouter>
              <RouterRoutes isNormal />
            </BrowserRouter>
          </WindowProvider>
        </ToastProvider>
      </MantineProvider>
    </ErrorBoundary>
  ) : (
    <Spinner.Centered />
  );
}
