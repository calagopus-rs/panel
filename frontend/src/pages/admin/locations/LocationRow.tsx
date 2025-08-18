import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/table/TableNew';
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

      <TableData>{location.backupDisk}</TableData>

      <TableData>{location.nodes}</TableData>
    </TableRow>
  );
};
