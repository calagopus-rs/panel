import ServerActivity from '@/pages/server/activity/ServerActivity';
import ServerBackups from '@/pages/server/backups/ServerBackups';
import ServerConsole from '@/pages/server/console/ServerConsole';
import ServerDatabases from '@/pages/server/databases/ServerDatabases';
import FileEditor from '@/pages/server/files/FileEditor';
import ServerFiles from '@/pages/server/files/ServerFiles';
import ServerNetwork from '@/pages/server/network/ServerNetwork';
import ScheduleView from '@/pages/server/schedules/ScheduleView';
import ServerSchedules from '@/pages/server/schedules/ServerSchedules';
import ServerSettings from '@/pages/server/settings/ServerSettings';
import ServerStartup from '@/pages/server/startup/ServerStartup';
import ServerSubusers from '@/pages/server/subusers/ServerSubusers';
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
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import React from 'react';

interface RouteDefinition {
  name: string | undefined;
  icon: IconDefinition | undefined;
  path: string;
  element: React.FC;
  exact?: boolean;
}

interface ServerRouteDefinition extends RouteDefinition {
  permission: string | string[] | null;
}

interface Routes {
  server: ServerRouteDefinition[];
}

export default {
  server: [
    {
      name: 'Console',
      icon: faTerminal,
      path: '',
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
      permission: 'network.*',
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
} as Routes;
