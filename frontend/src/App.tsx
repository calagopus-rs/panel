import { BrowserRouter, Route, Routes } from 'react-router';
import DashboardRouter from './routers/DashboardRouter';
import AuthenticationRouter from './routers/AuthenticationRouter';
import ServerRouter from './routers/ServerRouter';
import { ToastProvider } from './providers/ToastProvider';
import CheckingRouter from './routers/CheckingRouter';

export default function App() {
  return (
    <div>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/auth/*"
              element={
                <CheckingRouter requireUnauthenticated>
                  <AuthenticationRouter />
                </CheckingRouter>
              }
            />
            <Route
              path="/server/:id/*"
              element={
                <CheckingRouter requireAuthenticated>
                  <ServerRouter />
                </CheckingRouter>
              }
            />
            <Route
              path="/*"
              element={
                <CheckingRouter requireAuthenticated>
                  <DashboardRouter />
                </CheckingRouter>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </div>
  );
}
