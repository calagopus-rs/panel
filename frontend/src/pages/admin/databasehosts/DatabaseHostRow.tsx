import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/table/TableNew';
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
      <TableData>{databaseHost.type}</TableData>
      <TableData>
        <Code>
          {databaseHost.host}:{databaseHost.port}
        </Code>
      </TableData>
      <TableData>{databaseHost.databases}</TableData>
      <TableData>{databaseHost.locations}</TableData>
    </TableRow>
  );
};
