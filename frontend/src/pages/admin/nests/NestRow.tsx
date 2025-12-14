import { NavLink } from 'react-router';
import Code from '@/elements/Code.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';

export default function NestRow({ nest }: { nest: AdminNest }) {
  return (
    <TableRow>
      <TableData>
        <NavLink to={`/admin/nests/${nest.uuid}`} className='text-blue-400 hover:text-blue-200 hover:underline'>
          <Code>{nest.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{nest.name}</TableData>

      <TableData>{nest.author}</TableData>

      <TableData>{nest.description}</TableData>

      <TableData>
        <Tooltip label={formatDateTime(nest.created)}>{formatTimestamp(nest.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
}
