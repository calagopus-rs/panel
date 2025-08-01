import Code from '@/elements/Code';
import { TableRow } from '@/elements/table/Table';
import { NavLink } from 'react-router';

export default ({ node }: { node: Node }) => {
  return (
    <TableRow>
      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <Code>{node.id}</Code>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <NavLink to={`/admin/nodes/${node.id}`} className={'text-blue-400 hover:text-blue-200 hover:underline'}>
          {node.name}
        </NavLink>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{node.location.name}</td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <span className={node.public ? 'text-green-400' : 'text-red-400'}>{node.public ? 'Public' : 'Private'}</span>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{node.servers}</td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        {Math.round(node.memory / 1024)} GB
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{Math.round(node.disk / 1024)} GB</td>
    </TableRow>
  );
};
