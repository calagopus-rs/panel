import {
  faBriefcase,
  faBuilding,
  faCrow,
  faDatabase,
  faEarthAmerica,
  faFileZipper,
  faFingerprint,
  faFolder,
  faScroll,
  faServer,
  faUsers,
  faWrench,
} from '@fortawesome/free-solid-svg-icons';
import type { AdminRouteDefinition } from 'shared';
import { faComputer } from '@fortawesome/free-solid-svg-icons/faComputer';
import AdminHome from '@/pages/admin/AdminHome';
import AdminActivity from '@/pages/admin/activity/AdminActivity';
import AdminBackupConfigurations from '@/pages/admin/backupConfigurations/AdminBackupConfigurations';
import AdminDatabaseHosts from '@/pages/admin/databaseHosts/AdminDatabaseHosts';
import AdminLocations from '@/pages/admin/locations/AdminLocations';
import AdminMounts from '@/pages/admin/mounts/AdminMounts';
import AdminNests from '@/pages/admin/nests/AdminNests';
import AdminNodes from '@/pages/admin/nodes/AdminNodes';
import AdminOAuthProviders from '@/pages/admin/oAuthProviders/AdminOAuthProviders';
import AdminRoles from '@/pages/admin/roles/AdminRoles';
import AdminServers from '@/pages/admin/servers/AdminServers';
import AdminSettings from '@/pages/admin/settings/AdminSettings';
import AdminUsers from '@/pages/admin/users/AdminUsers';

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
