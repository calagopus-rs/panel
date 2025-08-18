import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/table/TableNew';
import { NavLink } from 'react-router';

export default ({ nest }: { nest: Nest }) => {
  return (
    <TableRow>
      <TableData>
        <NavLink to={`/admin/nests/${nest.uuid}`} className={'text-blue-400 hover:text-blue-200 hover:underline'}>
          <Code>{nest.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{nest.name}</TableData>

      <TableData>{nest.author}</TableData>

      <TableData>{nest.description}</TableData>

      <TableData>{nest.eggs}</TableData>
    </TableRow>
  );
};
