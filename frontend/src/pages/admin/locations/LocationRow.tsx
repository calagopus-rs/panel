import { NavLink } from 'react-router';
import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';

export default ({ location }: { location: Location }) => {
  return (
    <TableRow>
      <TableData>
        <NavLink to={`/admin/locations/${location.uuid}`} className='text-blue-400 hover:text-blue-200 hover:underline'>
          <Code>{location.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{location.name}</TableData>

      <TableData>
        <Code>
          {location.backupConfiguration ? (
            <NavLink
              to={`/admin/backup-configurations/${location.backupConfiguration.uuid}`}
              className='text-blue-400 hover:text-blue-200 hover:underline'
            >
              {location.backupConfiguration.name}
            </NavLink>
          ) : (
            '-'
          )}
        </Code>
      </TableData>

      <TableData>
        <Tooltip label={formatDateTime(location.created)}>{formatTimestamp(location.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
};
