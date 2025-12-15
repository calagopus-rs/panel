import {
  faBriefcase,
  faBuilding,
  faCrow,
  faDatabase,
  faDownload,
  faEarthAmerica,
  faFileZipper,
  faFingerprint,
  faFolder,
  faScroll,
  faServer,
  faUsers,
  faWrench,
} from '@fortawesome/free-solid-svg-icons';
import { faComputer } from '@fortawesome/free-solid-svg-icons/faComputer';
import type { AdminRouteDefinition } from 'shared';
import AdminHome from '@/pages/admin/AdminHome.tsx';
import AdminActivity from '@/pages/admin/activity/AdminActivity.tsx';
import AdminBackupConfigurations from '@/pages/admin/backupConfigurations/AdminBackupConfigurations.tsx';
import AdminDatabaseHosts from '@/pages/admin/databaseHosts/AdminDatabaseHosts.tsx';
import AdminEggRepositories from '@/pages/admin/eggRepositories/AdminEggRepositories.tsx';
import AdminLocations from '@/pages/admin/locations/AdminLocations.tsx';
import AdminMounts from '@/pages/admin/mounts/AdminMounts.tsx';
import AdminNests from '@/pages/admin/nests/AdminNests.tsx';
import AdminNodes from '@/pages/admin/nodes/AdminNodes.tsx';
import AdminOAuthProviders from '@/pages/admin/oAuthProviders/AdminOAuthProviders.tsx';
import AdminRoles from '@/pages/admin/roles/AdminRoles.tsx';
import AdminServers from '@/pages/admin/servers/AdminServers.tsx';
import AdminSettings from '@/pages/admin/settings/AdminSettings.tsx';
import AdminUsers from '@/pages/admin/users/AdminUsers.tsx';

const routes: AdminRouteDefinition[] = [
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
    icon: faComputer,
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
    name: 'Egg Repositories',
    icon: faDownload,
    path: '/egg-repositories/*',
    element: AdminEggRepositories,
  },
  {
    name: 'Database Hosts',
    icon: faDatabase,
    path: '/database-hosts/*',
    element: AdminDatabaseHosts,
  },
  {
    name: 'OAuth Providers',
    icon: faFingerprint,
    path: '/oauth-providers/*',
    element: AdminOAuthProviders,
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
];

export default routes;
