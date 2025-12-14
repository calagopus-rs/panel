import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/providers/AuthProvider.tsx';

export default function AuthenticatedGuard() {
  const { user } = useAuth();

  if (!user) return <Navigate to='/auth/login' />;

  return <Outlet />;
}
