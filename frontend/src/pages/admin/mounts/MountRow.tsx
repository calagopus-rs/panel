import { NavLink } from 'react-router';
import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';

export const mountTableColumns = ['ID', 'Name', 'Source', 'Target', 'Created'];

export default function MountRow({ mount }: { mount: Mount }) {
  return (
    <TableRow>
      <TableData>
        <NavLink to={`/admin/mounts/${mount.uuid}`} className='text-blue-400 hover:text-blue-200 hover:underline'>
          <Code>{mount.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{mount.name}</TableData>
      <TableData>
        <Code>{mount.source}</Code>
      </TableData>
      <TableData>
        <Code>{mount.target}</Code>
      </TableData>
      <TableData>
        <Tooltip label={formatDateTime(mount.created)}>{formatTimestamp(mount.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
}
