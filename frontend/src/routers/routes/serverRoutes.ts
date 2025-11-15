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
import ServerActivity from '@/pages/server/activity/ServerActivity';
import ServerBackups from '@/pages/server/backups/ServerBackups';
import ServerDatabases from '@/pages/server/databases/ServerDatabases';
import ServerFiles from '@/pages/server/files/ServerFiles';
import ServerNetwork from '@/pages/server/network/ServerNetwork';
import ScheduleView from '@/pages/server/schedules/ScheduleView';
import ServerSchedules from '@/pages/server/schedules/ServerSchedules';
import StepsEditor from '@/pages/server/schedules/StepsEditor';
import ServerSettings from '@/pages/server/settings/ServerSettings';
import ServerStartup from '@/pages/server/startup/ServerStartup';
import ServerSubusers from '@/pages/server/subusers/ServerSubusers';

const ServerConsole = lazy(() => import('@/pages/server/console/ServerConsole'));
const FileEditor = lazy(() => import('@/pages/server/files/FileEditor'));

interface ServerRouteDefinition extends RouteDefinition {
  permission: string | string[] | null;
}

const routes: ServerRouteDefinition[] = [
  {
    name: 'Console',
    icon: faTerminal,
    path: '/',
    element: ServerConsole,
    exact: true,
    permission: null,
  },
  {
    name: 'Files',
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
    name: 'Databases',
    icon: faDatabase,
    path: '/databases',
    element: ServerDatabases,
    permission: 'database.*',
  },
  {
    name: 'Schedules',
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
    name: undefined,
    path: '/schedules/:id/edit-steps',
    element: StepsEditor,
    permission: 'schedule.*',
  },
  {
    name: 'Subusers',
    icon: faUsers,
    path: '/subusers',
    element: ServerSubusers,
    permission: 'user.*',
  },
  {
    name: 'Backups',
    icon: faBoxArchive,
    path: '/backups',
    element: ServerBackups,
    permission: 'backups.*',
  },
  {
    name: 'Network',
    icon: faNetworkWired,
    path: '/network',
    element: ServerNetwork,
    permission: 'allocations.*',
  },
  {
    name: 'Startup',
    icon: faPlay,
    path: '/startup',
    element: ServerStartup,
    permission: 'startup.*',
  },
  {
    name: 'Settings',
    icon: faCog,
    path: '/settings',
    element: ServerSettings,
    permission: ['settings.*', 'file.sftp'],
  },
  {
    name: 'Activity',
    icon: faBriefcase,
    path: '/activity',
    element: ServerActivity,
    permission: 'activity.*',
  },
];

export default routes;
