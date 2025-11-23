import type { GlobalRouteDefinition } from 'shared';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import Login from '@/pages/auth/Login';
import LoginOAuth from '@/pages/auth/LoginSteps/LoginOAuth';
import Register from '@/pages/auth/Register';
import ResetPassword from '@/pages/auth/ResetPassword';

const routes: GlobalRouteDefinition[] = [
  {
    path: '/login',
    element: Login,
  },
  {
    path: '/login/oauth',
    element: LoginOAuth,
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
