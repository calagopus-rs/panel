import { Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import getSettings from './api/getSettings';
import Spinner from './elements/Spinner';
import AuthProvider from './providers/AuthProvider';
import { ToastProvider } from './providers/ToastProvider';
import AdminGuard from './routers/guards/AdminGuard';
import AuthenticatedGuard from './routers/guards/AuthenticatedGuard';
import UnauthenticatedGuard from './routers/guards/UnauthenticatedGuard';
import { useGlobalStore } from './stores/global';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { lazy } from 'react';
import OobeGuard from '@/routers/guards/OobeGuard';
import ErrorBoundary from './elements/ErrorBoundary';

const OobeRouter = lazy(() => import('./routers/OobeRouter'));
const AuthenticationRouter = lazy(() => import('./routers/AuthenticationRouter'));
const DashboardRouter = lazy(() => import('./routers/DashboardRouter'));
const AdminRouter = lazy(() => import('./routers/AdminRouter'));
const ServerRouter = lazy(() => import('./routers/ServerRouter'));

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
              <Suspense fallback={<Spinner.Centered />}>
                <Routes>
                  <Route element={<OobeGuard />}>
                    <Route path={'/oobe/*'} element={<OobeRouter />} />

                    <Route element={<UnauthenticatedGuard />}>
                      <Route path={'/auth/*'} element={<AuthenticationRouter />} />
                    </Route>

                    <Route element={<AuthenticatedGuard />}>
                      <Route path={'/server/:id/*'} element={<ServerRouter />} />
                      <Route path={'/*'} element={<DashboardRouter />} />

                      <Route element={<AdminGuard />}>
                        <Route path={'/admin/*'} element={<AdminRouter />} />
                      </Route>
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </MantineProvider>
    </ErrorBoundary>
  ) : (
    <Spinner.Centered />
  );
}
