import Code from '@/elements/Code';
import { TableRow } from '@/elements/table/Table';
import { NavLink } from 'react-router';

export default ({ nest, egg }: { nest: Nest; egg: AdminNestEgg }) => {
  return (
    <TableRow>
      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <Code>{egg.uuid}</Code>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <NavLink
          to={`/admin/nests/${nest.uuid}/eggs/${egg.uuid}`}
          className={'text-blue-400 hover:text-blue-200 hover:underline'}
        >
          {egg.name}
        </NavLink>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{egg.author}</td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'} title={egg.description}>
        {egg.description}
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{egg.servers}</td>
    </TableRow>
  );
};
