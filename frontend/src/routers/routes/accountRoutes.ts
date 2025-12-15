import {
  faBriefcase,
  faCloud,
  faFingerprint,
  faKey,
  faUnlockKeyhole,
  faUser,
  faUserSecret,
} from '@fortawesome/free-solid-svg-icons';
import type { RouteDefinition } from 'shared';
import DashboardAccount from '@/pages/dashboard/account/DashboardAccount.tsx';
import DashboardApiKeys from '@/pages/dashboard/api-keys/DashboardApiKeys.tsx';
import DashboardActivity from '@/pages/dashboard/DashboardActivity.tsx';
import DashboardOAuthLinks from '@/pages/dashboard/oauth-links/DashboardOAuthLinks.tsx';
import DashboardSecurityKeys from '@/pages/dashboard/security-keys/DashboardSecurityKeys.tsx';
import DashboardSessions from '@/pages/dashboard/sessions/DashboardSessions.tsx';
import DashboardSshKeys from '@/pages/dashboard/ssh-keys/DashboardSshKeys.tsx';

const routes: RouteDefinition[] = [
  {
    name: 'Account',
    icon: faUser,
    path: '/',
    element: DashboardAccount,
    exact: true,
  },
  {
    name: 'Security Keys',
    icon: faUnlockKeyhole,
    path: '/security-keys',
    element: DashboardSecurityKeys,
  },
  {
    name: 'API Keys',
    icon: faCloud,
    path: '/api-keys',
    element: DashboardApiKeys,
  },
  {
    name: 'SSH Keys',
    icon: faKey,
    path: '/ssh-keys',
    element: DashboardSshKeys,
  },
  {
    name: 'OAuth Links',
    icon: faFingerprint,
    path: '/oauth-links',
    element: DashboardOAuthLinks,
  },
  {
    name: 'Sessions',
    icon: faUserSecret,
    path: '/sessions',
    element: DashboardSessions,
  },
  {
    name: 'Activity',
    icon: faBriefcase,
    path: '/activity',
    element: DashboardActivity,
  },
];

export default routes;
