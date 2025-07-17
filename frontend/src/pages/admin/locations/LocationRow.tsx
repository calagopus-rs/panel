import Code from '@/elements/Code';
import { TableRow } from '@/elements/table/Table';
import { NavLink } from 'react-router';

export default ({ location }: { location: Location }) => {
  return (
    <TableRow>
      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
        <Code>{location.id}</Code>
      </td>

      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
        <NavLink to={`/admin/locations/${location.id}`} className={'text-blue-400 hover:text-blue-200 hover:underline'}>
          {location.shortName}
        </NavLink>
      </td>

      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={location.name}>
        {location.name}
      </td>
    </TableRow>
  );
};
