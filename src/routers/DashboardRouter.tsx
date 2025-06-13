import DashboardHome from '@/pages/dashboard/DashboardHome';
import { Route, Routes } from 'react-router';

export default function DashboardRouter() {
  return (
    <>
      <div className="h-screen flex">
        <Routes>
          <Route path="" element={<DashboardHome />} />
        </Routes>
      </div>
    </>
  );
}
