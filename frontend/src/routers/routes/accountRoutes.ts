import {
  faBriefcase,
  faCloud,
  faFingerprint,
  faKey,
  faUnlockKeyhole,
  faUser,
  faUserSecret,
} from '@fortawesome/free-solid-svg-icons';
import DashboardAccount from '@/pages/dashboard/account/DashboardAccount';
import DashboardApiKeys from '@/pages/dashboard/api-keys/DashboardApiKeys';
import DashboardActivity from '@/pages/dashboard/DashboardActivity';
import DashboardOAuthLinks from '@/pages/dashboard/oauth-links/DashboardOAuthLinks';
import DashboardSecurityKeys from '@/pages/dashboard/security-keys/DashboardSecurityKeys';
import DashboardSessions from '@/pages/dashboard/sessions/DashboardSessions';
import DashboardSshKeys from '@/pages/dashboard/ssh-keys/DashboardSshKeys';

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
