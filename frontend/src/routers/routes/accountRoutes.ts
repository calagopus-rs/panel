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
import { getTranslations } from '@/providers/TranslationProvider.tsx';

const routes: RouteDefinition[] = [
  {
    name: () => getTranslations().t('pages.account.account.title', {}),
    icon: faUser,
    path: '/',
    element: DashboardAccount,
    exact: true,
  },
  {
    name: () => getTranslations().t('pages.account.securityKeys.title', {}),
    icon: faUnlockKeyhole,
    path: '/security-keys',
    element: DashboardSecurityKeys,
  },
  {
    name: () => getTranslations().t('pages.account.apiKeys.title', {}),
    icon: faCloud,
    path: '/api-keys',
    element: DashboardApiKeys,
  },
  {
    name: () => getTranslations().t('pages.account.sshKeys.title', {}),
    icon: faKey,
    path: '/ssh-keys',
    element: DashboardSshKeys,
  },
  {
    name: () => getTranslations().t('pages.account.oauthLinks.title', {}),
    icon: faFingerprint,
    path: '/oauth-links',
    element: DashboardOAuthLinks,
  },
  {
    name: () => getTranslations().t('pages.account.sessions.title', {}),
    icon: faUserSecret,
    path: '/sessions',
    element: DashboardSessions,
  },
  {
    name: () => getTranslations().t('pages.account.activity.title', {}),
    icon: faBriefcase,
    path: '/activity',
    element: DashboardActivity,
  },
];

export default routes;
