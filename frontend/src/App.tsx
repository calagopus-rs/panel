import { BrowserRouter, Route, RouteProps, Routes, useNavigate } from 'react-router';
import DashboardRouter from './routers/DashboardRouter';
import AuthenticationRouter from './routers/AuthenticationRouter';
import ServerRouter from './routers/ServerRouter';
import { ToastProvider } from './elements/Toast';
import { useUserStore } from './stores/user';
import { useEffect } from 'react';
import getMe from './api/me/getMe';

export default function App() {
  const { setUser } = useUserStore();

  useEffect(() => {
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
