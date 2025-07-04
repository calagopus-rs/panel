import { BrowserRouter, Route, Routes, useLocation, useRoutes } from 'react-router';
import DashboardRouter from './routers/DashboardRouter';
import AuthenticationRouter from './routers/AuthenticationRouter';
import ServerRouter from './routers/ServerRouter';
import { useUserStore } from './stores/user';
import { useEffect } from 'react';
import getMe from './api/me/getMe';
import { ToastProvider } from './providers/ToastProvider';

export default function App() {
  const location = useLocation();
  const { setUser } = useUserStore();

  useEffect(() => {
    if (location.pathname.toLowerCase().startsWith('/auth')) return;

    getMe().then(user => setUser(user));
  }, []);

  return (
    <div>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth/*" element={<AuthenticationRouter />} />
            <Route path="/server/:id/*" element={<ServerRouter />} />
            <Route path="/*" element={<DashboardRouter />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </div>
  );
}
