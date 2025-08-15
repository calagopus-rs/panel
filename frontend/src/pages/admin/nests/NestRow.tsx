import Code from '@/elements/Code';
import { TableRow } from '@/elements/table/Table';
import { NavLink } from 'react-router';

export default ({ nest }: { nest: Nest }) => {
  return (
    <TableRow>
      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <Code>{nest.id}</Code>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <NavLink to={`/admin/nests/${nest.id}`} className={'text-blue-400 hover:text-blue-200 hover:underline'}>
          {nest.name}
        </NavLink>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{nest.author}</td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'} title={nest.description}>
        {nest.description}
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{nest.eggs}</td>
    </TableRow>
  );
};
