import { Suspense } from 'react';
import { Route, Routes } from 'react-router';
import Spinner from './elements/Spinner';
import AuthProvider from './providers/AuthProvider';
import AdminGuard from './routers/guards/AdminGuard';
import AuthenticatedGuard from './routers/guards/AuthenticatedGuard';
import UnauthenticatedGuard from './routers/guards/UnauthenticatedGuard';
import '@mantine/core/styles.css';
import { lazy } from 'react';
import OobeGuard from '@/routers/guards/OobeGuard';
import globalRoutes from './routers/routes/globalRoutes';
import NotFound from './pages/NotFound';
import { AdminStoreContextProvider, createAdminStore } from './stores/admin';
import { createServerStore, ServerStoreContextprovider } from './stores/server';

const OobeRouter = lazy(() => import('./routers/OobeRouter'));
const AuthenticationRouter = lazy(() => import('./routers/AuthenticationRouter'));
const DashboardRouter = lazy(() => import('./routers/DashboardRouter'));
const AdminRouter = lazy(() => import('./routers/AdminRouter'));
const ServerRouter = lazy(() => import('./routers/ServerRouter'));

export default function RouterRoutes({ isNormal }: { isNormal: boolean }) {
  return (
    <AdminStoreContextProvider createStore={createAdminStore}>
      <ServerStoreContextprovider createStore={createServerStore}>
        <AuthProvider>
          <Suspense fallback={<Spinner.Centered />}>
            <Routes>
              {globalRoutes
                .filter((route) => !route.filter || route.filter())
                .map(({ path, element: Element }) => (
                  <Route key={path} path={path} element={<Element />} />
                ))}
              {window.extensionContext.routes.globalRoutes
                .filter((route) => !route.filter || route.filter())
                .map(({ path, element: Element }) => (
                  <Route key={path} path={path} element={<Element />} />
                ))}

              <Route element={<OobeGuard />}>
                <Route path='/oobe/*' element={<OobeRouter />} />

                <Route element={<UnauthenticatedGuard />}>
                  <Route path='/auth/*' element={<AuthenticationRouter />} />
                </Route>

                <Route element={<AuthenticatedGuard />}>
                  <Route path='/server/:id/*' element={<ServerRouter isNormal={isNormal} />} />
                  <Route path='/*' element={<DashboardRouter isNormal={isNormal} />} />

                  <Route element={<AdminGuard />}>
                    <Route path='/admin/*' element={<AdminRouter isNormal={isNormal} />} />
                  </Route>
                </Route>

                <Route path='*' element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ServerStoreContextprovider>
    </AdminStoreContextProvider>
  );
}
