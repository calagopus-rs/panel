import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { databaseTypeLabelMapping } from '@/lib/enums';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { NavLink } from 'react-router';

export default ({ databaseHost }: { databaseHost: AdminDatabaseHost }) => {
  return (
    <TableRow>
      <TableData>
        <NavLink
          to={`/admin/database-hosts/${databaseHost.uuid}`}
          className={'text-blue-400 hover:text-blue-200 hover:underline'}
        >
          <Code>{databaseHost.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{databaseHost.name}</TableData>
      <TableData>{databaseTypeLabelMapping[databaseHost.type]}</TableData>
      <TableData>
        <Code>
          {databaseHost.host}:{databaseHost.port}
        </Code>
      </TableData>
      <TableData>
        <Tooltip label={formatDateTime(databaseHost.created)}>{formatTimestamp(databaseHost.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
};
