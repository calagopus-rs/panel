import { Navigate, Outlet, useLocation } from 'react-router';
import { useGlobalStore } from '@/stores/global';

export default function OobeGuard() {
  const { settings } = useGlobalStore();
  const location = useLocation();

  const inOobe = location.pathname.startsWith('/oobe');
  const oobeCompleted = settings.oobeStep === null;

  if (!oobeCompleted && !inOobe) {
    return <Navigate to='/oobe' />;
  }

  if (oobeCompleted && inOobe) {
    return <Navigate to='/' />;
  }

  return <Outlet />;
}
