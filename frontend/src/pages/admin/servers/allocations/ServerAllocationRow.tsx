import Code from '@/elements/Code';
import Checkbox from '@/elements/input/Checkbox';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useAdminStore } from '@/stores/admin';

export default ({ allocation }: { allocation: NodeAllocation }) => {
  return (
    <>
      <TableRow>
        <TableData>
          <Code>{allocation.uuid}</Code>
        </TableData>
        <TableData>
          <Code>{allocation.ip}</Code>
        </TableData>
        <TableData>
          <Code>{allocation.ipAlias ?? 'N/A'}</Code>
        </TableData>
        <TableData>
          <Code>{allocation.port}</Code>
        </TableData>
        <TableData>
          <Tooltip label={formatDateTime(allocation.created)}>{formatTimestamp(allocation.created)}</Tooltip>
        </TableData>
      </TableRow>
    </>
  );
};
