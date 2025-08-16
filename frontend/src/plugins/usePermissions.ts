import { useServerStore } from '@/stores/server';

export const usePermissions = (action: string | string[]): boolean[] => {
  const server = useServerStore((state) => state.server);

  if (!server) {
    return Array(Array.isArray(action) ? action.length : 1).fill(false);
  }

  if (server.permissions[0] === '*') {
    return Array(Array.isArray(action) ? action.length : 1).fill(true);
  }

  return (Array.isArray(action) ? action : [action]).map(
    (permission) =>
      // Allows checking for any permission matching a name, for example files.*
      // will return if the user has any permission under the file.XYZ namespace.
      (permission.endsWith('.*') &&
        server.permissions.filter((p) => p.startsWith(permission.split('.')[0])).length > 0) ||
      // Otherwise just check if the entire permission exists in the array or not.
      server.permissions.indexOf(permission) >= 0,
  );
};
