import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/providers/AuthProvider.tsx';

export default function UnauthenticatedGuard() {
  const { user } = useAuth();

  if (user) return <Navigate to='/' />;

  return <Outlet />;
}
