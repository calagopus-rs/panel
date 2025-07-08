import { useAuth } from '@/providers/AuthProvider';
import { Navigate, Outlet } from 'react-router';

export default () => {
  const { user } = useAuth();

  if (!user.admin) return <Navigate to="/" />;

  return <Outlet />;
};
