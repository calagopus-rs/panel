import {
  faBoxArchive,
  faBriefcase,
  faCog,
  faDatabase,
  faFolderOpen,
  faNetworkWired,
  faPlay,
  faStopwatch,
  faTerminal,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { lazy } from 'react';
import type { ServerRouteDefinition } from 'shared';
import ServerActivity from '@/pages/server/activity/ServerActivity.tsx';
import ServerBackups from '@/pages/server/backups/ServerBackups.tsx';
import ServerDatabases from '@/pages/server/databases/ServerDatabases.tsx';
import ServerFiles from '@/pages/server/files/ServerFiles.tsx';
import ServerNetwork from '@/pages/server/network/ServerNetwork.tsx';
import ScheduleView from '@/pages/server/schedules/ScheduleView.tsx';
import ServerSchedules from '@/pages/server/schedules/ServerSchedules.tsx';
import ServerSettings from '@/pages/server/settings/ServerSettings.tsx';
import ServerStartup from '@/pages/server/startup/ServerStartup.tsx';
import ServerSubusers from '@/pages/server/subusers/ServerSubusers.tsx';
import { getTranslations } from '@/providers/TranslationProvider.tsx';

const ServerConsole = lazy(() => import('@/pages/server/console/ServerConsole.tsx'));
const FileEditor = lazy(() => import('@/pages/server/files/FileEditor.tsx'));

const routes: ServerRouteDefinition[] = [
  {
    name: () => getTranslations().t('pages.server.console.title', {}),
    icon: faTerminal,
    path: '/',
    element: ServerConsole,
    exact: true,
    permission: null,
  },
  {
    name: () => getTranslations().t('pages.server.files.title', {}),
    icon: faFolderOpen,
    path: '/files',
    element: ServerFiles,
    permission: 'file.*',
  },
  {
    name: undefined,
    path: '/files/:action',
    element: FileEditor,
    permission: 'file.*',
  },
  {
    name: () => getTranslations().t('pages.server.databases.title', {}),
    icon: faDatabase,
    path: '/databases',
    element: ServerDatabases,
    permission: 'database.*',
  },
  {
    name: () => getTranslations().t('pages.server.schedules.title', {}),
    icon: faStopwatch,
    path: '/schedules',
    element: ServerSchedules,
    permission: 'schedule.*',
  },
  {
    name: undefined,
    path: '/schedules/:id',
    element: ScheduleView,
    permission: 'schedule.*',
  },
  {
    name: () => getTranslations().t('pages.server.subusers.title', {}),
    icon: faUsers,
    path: '/subusers',
    element: ServerSubusers,
    permission: 'user.*',
  },
  {
    name: () => getTranslations().t('pages.server.backups.title', {}),
    icon: faBoxArchive,
    path: '/backups',
    element: ServerBackups,
    permission: 'backups.*',
  },
  {
    name: () => getTranslations().t('pages.server.network.title', {}),
    icon: faNetworkWired,
    path: '/network',
    element: ServerNetwork,
    permission: 'allocations.*',
  },
  {
    name: () => getTranslations().t('pages.server.startup.title', {}),
    icon: faPlay,
    path: '/startup',
    element: ServerStartup,
    permission: 'startup.*',
  },
  {
    name: () => getTranslations().t('pages.server.settings.title', {}),
    icon: faCog,
    path: '/settings',
    element: ServerSettings,
    permission: ['settings.*', 'file.sftp'],
  },
  {
    name: () => getTranslations().t('pages.server.activity.title', {}),
    icon: faBriefcase,
    path: '/activity',
    element: ServerActivity,
    permission: 'activity.*',
  },
];

export default routes;
