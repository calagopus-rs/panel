import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/providers/AuthProvider';

export default function UnauthenticatedRoute() {
  const { user } = useAuth();

  if (user) return <Navigate to={'/'} />;

  return <Outlet />;
}
