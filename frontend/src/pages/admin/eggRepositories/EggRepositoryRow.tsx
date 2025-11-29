import { NavLink } from 'react-router';
import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';

export const eggRepositoryTableColumns = ['ID', 'Name', 'Description', 'Git Repository', 'Created'];

export default function EggRepositoryRow({ eggRepository }: { eggRepository: AdminEggRepository }) {
  return (
    <TableRow>
      <TableData>
        <NavLink
          to={`/admin/egg-repositories/${eggRepository.uuid}`}
          className='text-blue-400 hover:text-blue-200 hover:underline'
        >
          <Code>{eggRepository.uuid}</Code>
        </NavLink>
      </TableData>

      <TableData>{eggRepository.name}</TableData>

      <TableData>{eggRepository.description}</TableData>

      <TableData>
        <Code>{eggRepository.gitRepository}</Code>
      </TableData>

      <TableData>
        <Tooltip label={formatDateTime(eggRepository.created)}>{formatTimestamp(eggRepository.created)}</Tooltip>
      </TableData>
    </TableRow>
  );
}
