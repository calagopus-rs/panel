import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { NavLink } from 'react-router';

export const roleTableColumns = ['Id', 'Name', 'Server Permissions', 'Admin Permissions', 'Created'];

export default ({ role }: { role: Role }) => {
  return (
    <TableRow>
      <TableData>
        <NavLink to={`/admin/roles/${role.uuid}`} className={'text-blue-400 hover:text-blue-200 hover:underline'}>
          <Code>{role.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{role.name}</TableData>

      <TableData>{role.serverPermissions.length}</TableData>

      <TableData>{role.adminPermissions.length}</TableData>

      <TableData>
        <Tooltip label={formatDateTime(role.created)}>{formatTimestamp(role.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
};
