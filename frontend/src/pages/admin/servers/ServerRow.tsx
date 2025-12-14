import { NavLink } from 'react-router';
import Code from '@/elements/Code.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';

export default function ServerRow({ server }: { server: AdminServer }) {
  return (
    <TableRow>
      <TableData>
        <NavLink to={`/admin/servers/${server.uuid}`} className='text-blue-400 hover:text-blue-200 hover:underline'>
          <Code>{server.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{server.name}</TableData>

      <TableData>
        <NavLink to={`/admin/nodes/${server.node.uuid}`} className='text-blue-400 hover:text-blue-200 hover:underline'>
          <Code>{server.node.name}</Code>
        </NavLink>
      </TableData>

      <TableData>
        <NavLink to={`/admin/users/${server.owner.uuid}`} className='text-blue-400 hover:text-blue-200 hover:underline'>
          <Code>{server.owner.username}</Code>
        </NavLink>
      </TableData>

      <TableData>
        <Code>{server.allocation ? `${server.allocation.ip}:${server.allocation.port}` : '-'}</Code>
      </TableData>

      <TableData>
        <Tooltip label={formatDateTime(server.created)}>{formatTimestamp(server.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
}
