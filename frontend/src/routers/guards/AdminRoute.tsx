import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/providers/AuthProvider';
import AdminRoutes from '@/routers/routes/adminRoutes';

export default function AdminRoute() {
  const { user } = useAuth();

  if (!user.admin) return <Navigate to={'/'} />;

  return <Outlet />;
}
