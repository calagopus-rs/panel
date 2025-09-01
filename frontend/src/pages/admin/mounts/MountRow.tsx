import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import { NavLink } from 'react-router';

export default ({ mount }: { mount: Mount }) => {
  return (
    <TableRow>
      <TableData>
        <NavLink to={`/admin/mounts/${mount.uuid}`} className={'text-blue-400 hover:text-blue-200 hover:underline'}>
          <Code>{mount.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{mount.name}</TableData>
      <TableData>
        <Code>{mount.source}</Code>
      </TableData>
      <TableData>
        <Code>{mount.target}</Code>
      </TableData>
      <TableData>{mount.servers}</TableData>
      <TableData>{mount.nodes}</TableData>
    </TableRow>
  );
};
