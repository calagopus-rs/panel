import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { NavLink } from 'react-router';

export const locationTableColumns = ['Id', 'Name', 'Backup Disk', 'Created'];

export default ({ location }: { location: Location }) => {
  return (
    <TableRow>
      <TableData>
        <NavLink
          to={`/admin/locations/${location.uuid}`}
          className={'text-blue-400 hover:text-blue-200 hover:underline'}
        >
          <Code>{location.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{location.name}</TableData>

      <TableData>
        {location.backupConfiguration ? (
          <NavLink
            to={`/admin/backup-configurations/${location.backupConfiguration.uuid}`}
            className={'text-blue-400 hover:text-blue-200 hover:underline'}
          >
            <Code>{location.backupConfiguration.name}</Code>
          </NavLink>
        ) : (
          '-'
        )}
      </TableData>

      <TableData>
        <Tooltip label={formatDateTime(location.created)}>{formatTimestamp(location.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
};
