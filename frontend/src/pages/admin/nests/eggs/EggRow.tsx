import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/table/TableNew';
import { NavLink } from 'react-router';

export default ({ nest, egg }: { nest: Nest; egg: AdminNestEgg }) => {
  return (
    <TableRow>
      <TableData>
        <NavLink
          to={`/admin/nests/${nest.uuid}/eggs/${egg.uuid}`}
          className={'text-blue-400 hover:text-blue-200 hover:underline'}
        >
          <Code>{egg.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{egg.name}</TableData>

      <TableData>{egg.author}</TableData>

      <TableData>{egg.description}</TableData>

      <TableData>{egg.servers}</TableData>
    </TableRow>
  );
};
