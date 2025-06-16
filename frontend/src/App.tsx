import { BrowserRouter, Route, Routes } from 'react-router';
import DashboardRouter from './routers/DashboardRouter';
import AuthenticationRouter from './routers/AuthenticationRouter';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/*" element={<AuthenticationRouter />} />
          <Route path="/*" element={<DashboardRouter />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
