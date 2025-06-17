import { BrowserRouter, Route, Routes } from 'react-router';
import DashboardRouter from './routers/DashboardRouter';
import AuthenticationRouter from './routers/AuthenticationRouter';
import ServerRouter from './routers/ServerRouter';
import { ToastProvider } from './elements/Toast';

function App() {
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

export default App;
