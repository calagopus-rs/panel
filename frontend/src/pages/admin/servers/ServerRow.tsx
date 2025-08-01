import Code from '@/elements/Code';
import { TableRow } from '@/elements/table/Table';
import { NavLink } from 'react-router';

export default ({ server }: { server: AdminServer }) => {
  const getStatusColor = (status: ServerStatus | null, suspended: boolean) => {
    if (suspended) return 'text-red-400';
    if (!status) return 'text-green-400';
    switch (status) {
      case 'installing':
        return 'text-yellow-400';
      case 'install_failed':
      case 'reinstall_failed':
        return 'text-red-400';
      case 'restoring_backup':
        return 'text-blue-400';
      default:
        return 'text-neutral-400';
    }
  };

  const getStatusText = (status: ServerStatus | null, suspended: boolean) => {
    if (suspended) return 'Suspended';
    if (!status) return 'Ready';
    switch (status) {
      case 'installing':
        return 'Installing';
      case 'install_failed':
        return 'Install Failed';
      case 'reinstall_failed':
        return 'Reinstall Failed';
      case 'restoring_backup':
        return 'Restoring Backup';
      default:
        return 'Unknown';
    }
  };

  return (
    <TableRow>
      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <Code>{server.id}</Code>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <NavLink to={`/admin/servers/${server.id}`} className={'text-blue-400 hover:text-blue-200 hover:underline'}>
          {server.name}
        </NavLink>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{server.ower.username}</td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{server.node.name}</td>

      <td className={'px-6 text-sm text-left whitespace-nowrap'}>
        <span className={getStatusColor(server.status, server.suspended)}>
          {getStatusText(server.status, server.suspended)}
        </span>
      </td>
    </TableRow>
  );
};
