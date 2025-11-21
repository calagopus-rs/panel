import type { GlobalRouteDefinition } from 'shared';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';

const routes: GlobalRouteDefinition[] = [
  {
    path: '/login',
    element: Login,
  },
  {
    path: '/register',
    element: Register,
  },
  {
    path: '/forgot-password',
    element: ForgotPassword,
  },
  {
    path: '/reset-password',
    element: ResetPassword,
  },
];

export default routes;
