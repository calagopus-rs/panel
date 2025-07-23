import { BrowserRouter, Route, Routes } from 'react-router';
import DashboardRouter from './routers/DashboardRouter';
import AuthenticationRouter from './routers/AuthenticationRouter';
import ServerRouter from './routers/ServerRouter';
import { ToastProvider } from './providers/ToastProvider';
import AdminRouter from './routers/AdminRouter';
import AuthProvider from './providers/AuthProvider';
import AuthenticatedRoute from './routers/guards/AuthenticatedRoute';
import AdminRoute from './routers/guards/AdminRoute';
import UnauthenticatedRoute from './routers/guards/UnauthenticatedRoute';
import { useGlobalStore } from './stores/global';
import { useEffect } from 'react';
import getSettings from './api/getSettings';
import Spinner from './elements/Spinner';

export default function App() {
  const { settings, setSettings } = useGlobalStore();

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  return settings ? (
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
  ) : (
    <Spinner.Centered />
  );
}
