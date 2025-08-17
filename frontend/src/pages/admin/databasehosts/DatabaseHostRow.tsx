import Code from '@/elements/Code';
import { TableRow } from '@/elements/table/Table';
import { NavLink } from 'react-router';

export default ({ databaseHost }: { databaseHost: AdminDatabaseHost }) => {
  return (
    <TableRow>
      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <NavLink
          to={`/admin/database-hosts/${databaseHost.uuid}`}
          className={'text-blue-400 hover:text-blue-200 hover:underline'}
        >
          <Code>{databaseHost.uuid}</Code>
        </NavLink>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{databaseHost.name}</td>
      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{databaseHost.type}</td>
      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <Code>
          {databaseHost.host}:{databaseHost.port}
        </Code>
      </td>
      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{databaseHost.databases}</td>
      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{databaseHost.locations}</td>
    </TableRow>
  );
};
