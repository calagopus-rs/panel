import { BrowserRouter, Route, Routes } from 'react-router';
import DashboardRouter from './routers/DashboardRouter';
import AuthenticationRouter from './routers/AuthenticationRouter';
import ServerRouter from './routers/ServerRouter';
import { ToastProvider } from './providers/ToastProvider';
import AdminRouter from './routers/AdminRouter';
import { useEffect, useState } from 'react';
import getMe from './api/me/getMe';
import { useUserStore } from './stores/user';
import Spinner from './elements/Spinner';

const RenderCondition = ({ condition, children }) => {
  if (condition) {
    return <>{children}</>;
  }

  return <Spinner.Centered />;
};

export default function App() {
  const { user, setUser } = useUserStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(user => setUser(user))
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/auth/*"
              element={
                <RenderCondition condition={!loading && !user}>
                  <AuthenticationRouter />
                </RenderCondition>
              }
            />
            <Route
              path="/server/:id/*"
              element={
                <RenderCondition condition={!loading && user}>
                  <ServerRouter />
                </RenderCondition>
              }
            />
            <Route
              path="/admin/*"
              element={
                <RenderCondition condition={!loading && user}>
                  <AdminRouter />
                </RenderCondition>
              }
            />
            <Route
              path="/*"
              element={
                <RenderCondition condition={!loading && user}>
                  <DashboardRouter />
                </RenderCondition>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </div>
  );
}
