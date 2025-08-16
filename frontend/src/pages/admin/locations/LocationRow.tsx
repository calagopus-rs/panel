import Code from '@/elements/Code';
import { TableRow } from '@/elements/table/Table';
import { NavLink } from 'react-router';

export default ({ location }: { location: Location }) => {
  return (
    <TableRow>
      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <NavLink
          to={`/admin/locations/${location.uuid}`}
          className={'text-blue-400 hover:text-blue-200 hover:underline'}
        >
          <Code>{location.uuid}</Code>
        </NavLink>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{location.shortName}</td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'} title={location.name}>
        {location.name}
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{location.backupDisk}</td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{location.nodes}</td>
    </TableRow>
  );
};
