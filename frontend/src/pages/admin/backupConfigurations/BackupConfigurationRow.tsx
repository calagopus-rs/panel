import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { backupDiskLabelMapping } from '@/lib/enums';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { NavLink } from 'react-router';

export default ({ backupConfiguration }: { backupConfiguration: BackupConfiguration }) => {
  return (
    <TableRow>
      <TableData>
        <NavLink
          to={`/admin/backup-configurations/${backupConfiguration.uuid}`}
          className={'text-blue-400 hover:text-blue-200 hover:underline'}
        >
          <Code>{backupConfiguration.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{backupConfiguration.name}</TableData>
      <TableData>{backupDiskLabelMapping[backupConfiguration.backupDisk]}</TableData>

      <TableData>
        <Tooltip label={formatDateTime(backupConfiguration.created)}>
          {formatTimestamp(backupConfiguration.created)}
        </Tooltip>
      </TableData>
    </TableRow>
  );
};
