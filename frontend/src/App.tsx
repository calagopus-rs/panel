import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import getSettings from './api/getSettings';
import Spinner from './elements/Spinner';
import AuthProvider from './providers/AuthProvider';
import { ToastProvider } from './providers/ToastProvider';
import AdminRouter from './routers/AdminRouter';
import AuthenticationRouter from './routers/AuthenticationRouter';
import DashboardRouter from './routers/DashboardRouter';
import AdminRoute from './routers/guards/AdminRoute';
import AuthenticatedRoute from './routers/guards/AuthenticatedRoute';
import UnauthenticatedRoute from './routers/guards/UnauthenticatedRoute';
import ServerRouter from './routers/ServerRouter';
import { useGlobalStore } from './stores/global';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import ErrorBoundary from './elements/ErrorBoundary';

export default function App() {
  const { settings, setSettings } = useGlobalStore();

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  return settings ? (
    <ErrorBoundary>
      <MantineProvider forceColorScheme={'dark'}>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route element={<UnauthenticatedRoute />}>
                  <Route path={'/auth/*'} element={<AuthenticationRouter />} />
                </Route>

                <Route element={<AuthenticatedRoute />}>
                  <Route path={'/server/:id/*'} element={<ServerRouter />} />
                  <Route path={'/*'} element={<DashboardRouter />} />

                  <Route element={<AdminRoute />}>
                    <Route path={'/admin/*'} element={<AdminRouter />} />
                  </Route>
                </Route>
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </MantineProvider>
    </ErrorBoundary>
  ) : (
    <Spinner.Centered />
  );
}
