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

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<UnauthenticatedRoute />}>
              <Route path="/auth/*" element={<AuthenticationRouter />} />
            </Route>

            <Route element={<AuthenticatedRoute />}>
              <Route path="/server/:id/*" element={<ServerRouter />} />
              <Route path="/*" element={<DashboardRouter />} />

              <Route element={<AdminRoute />}>
                <Route path="/admin/*" element={<AdminRouter />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}
