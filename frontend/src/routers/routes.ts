import AdminActivity from '@/pages/admin/activity/AdminActivity';
import AdminHome from '@/pages/admin/AdminHome';
import AdminDatabaseHosts from '@/pages/admin/databaseHosts/AdminDatabaseHosts';
import AdminLocations from '@/pages/admin/locations/AdminLocations';
import AdminMounts from '@/pages/admin/mounts/AdminMounts';
import AdminNests from '@/pages/admin/nests/AdminNests';
import AdminNodes from '@/pages/admin/nodes/AdminNodes';
import AdminServers from '@/pages/admin/servers/AdminServers';
import AdminSettings from '@/pages/admin/settings/AdminSettings';
import AdminUsers from '@/pages/admin/users/AdminUsers';
import DashboardAccount from '@/pages/dashboard/account/DashboardAccount';
import DashboardApiKeys from '@/pages/dashboard/api-keys/DashboardApiKeys';
import DashboardActivity from '@/pages/dashboard/DashboardActivity';
import DashboardSecurityKeys from '@/pages/dashboard/security-keys/DashboardSecurityKeys';
import DashboardSessions from '@/pages/dashboard/sessions/DashboardSessions';
import DashboardSshKeys from '@/pages/dashboard/ssh-keys/DashboardSshKeys';
import ServerActivity from '@/pages/server/activity/ServerActivity';
import ServerBackups from '@/pages/server/backups/ServerBackups';
import ServerConsole from '@/pages/server/console/ServerConsole';
import ServerDatabases from '@/pages/server/databases/ServerDatabases';
import FileEditor from '@/pages/server/files/FileEditor';
import ServerFiles from '@/pages/server/files/ServerFiles';
import ServerNetwork from '@/pages/server/network/ServerNetwork';
import ScheduleEdit from '@/pages/server/schedules/ScheduleEdit';
import ScheduleView from '@/pages/server/schedules/ScheduleView';
import ServerSchedules from '@/pages/server/schedules/ServerSchedules';
import StepsEditor from '@/pages/server/schedules/StepsEditor';
import ServerSettings from '@/pages/server/settings/ServerSettings';
import ServerStartup from '@/pages/server/startup/ServerStartup';
import ServerSubusers from '@/pages/server/subusers/ServerSubusers';
import {
  faBoxArchive,
  faBriefcase,
  faBuilding,
  faCloud,
  faCog,
  faCrow,
  faDatabase,
  faDesktop,
  faEarthAmerica,
  faFileZipper,
  faFolder,
  faFolderOpen,
  faKey,
  faNetworkWired,
  faPlay,
  faScroll,
  faServer,
  faStopwatch,
  faTerminal,
  faUnlockKeyhole,
  faUser,
  faUsers,
  faUserSecret,
  faWrench,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import AdminBackupConfigurations from '@/pages/admin/backupConfigurations/AdminBackupConfigurations';
import AdminRoles from '@/pages/admin/roles/AdminRoles';

interface RouteDefinition {
  name: string | undefined;
  icon?: IconDefinition;
  path: string;
  element: React.FC;
  exact?: boolean;
}

interface ServerRouteDefinition extends RouteDefinition {
  permission: string | string[] | null;
}

interface Routes {
  account: RouteDefinition[];
  admin: RouteDefinition[];
  server: ServerRouteDefinition[];
}

export const to = (value: string, base: string = '') => {
  if (value === '/') {
    return base;
  }

  const clean = value
    .replace(/^\/+/, '') // remove leading slashes
    .replace(/\/\*$/, ''); // remove /*

  return `${base.replace(/\/+$/, '')}/${clean}`;
};

const routes: Routes = {
  account: [
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
  ],
  admin: [
    {
      name: 'Overview',
      icon: faBuilding,
      path: '/',
      element: AdminHome,
      exact: true,
    },
    {
      name: 'Settings',
      icon: faWrench,
      path: '/settings/*',
      element: AdminSettings,
    },
    {
      name: 'Users',
      icon: faUsers,
      path: '/users/*',
      element: AdminUsers,
    },
    {
      name: 'Locations',
      icon: faEarthAmerica,
      path: '/locations/*',
      element: AdminLocations,
    },
    {
      name: 'Nodes',
      icon: faServer,
      path: '/nodes/*',
      element: AdminNodes,
    },
    {
      name: 'Servers',
      icon: faDesktop,
      path: '/servers/*',
      element: AdminServers,
    },
    {
      name: 'Nests',
      icon: faCrow,
      path: '/nests/*',
      element: AdminNests,
    },
    {
      name: 'Database Hosts',
      icon: faDatabase,
      path: '/database-hosts/*',
      element: AdminDatabaseHosts,
    },
    {
      name: 'Backup Configs',
      icon: faFileZipper,
      path: '/backup-configurations/*',
      element: AdminBackupConfigurations,
    },
    {
      name: 'Mounts',
      icon: faFolder,
      path: '/mounts/*',
      element: AdminMounts,
    },
    {
      name: 'Roles',
      icon: faScroll,
      path: '/roles/*',
      element: AdminRoles,
    },
    {
      name: 'Activity',
      icon: faBriefcase,
      path: '/activity',
      element: AdminActivity,
    },
  ],
  server: [
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
      path: '/schedules/:id/edit',
      element: ScheduleEdit,
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
  ],
};

export default routes;
