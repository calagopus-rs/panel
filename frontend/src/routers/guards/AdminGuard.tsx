import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/providers/AuthProvider';

export default function AdminGuard() {
  const { user } = useAuth();

  if (!user.admin) return <Navigate to={'/'} />;

  return <Outlet />;
}
