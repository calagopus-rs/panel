import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { locationConfigBackupDiskLabelMapping } from '@/lib/enums';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { NavLink } from 'react-router';

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

      <TableData>{location.shortName}</TableData>

      <TableData>{location.name}</TableData>

      <TableData>{locationConfigBackupDiskLabelMapping[location.backupDisk]}</TableData>

      <TableData>
        <Tooltip label={formatDateTime(location.created)}>{formatTimestamp(location.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
};
