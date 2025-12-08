import { forwardRef, memo } from 'react';
import Code from '@/elements/Code';
import Checkbox from '@/elements/input/Checkbox';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useAdminStore } from '@/stores/admin';
import { NavLink } from 'react-router';

interface NodeAllocationRowProps {
  allocation: NodeAllocation;
}

const NodeAllocationRow = memo(
  forwardRef<HTMLTableRowElement, NodeAllocationRowProps>(function FileRow({ allocation }, ref) {
    const { isNodeAllocationSelected, addSelectedNodeAllocation, removeSelectedNodeAllocation } = useAdminStore();

    return (
      <TableRow
        bg={isNodeAllocationSelected(allocation) ? 'var(--mantine-color-blue-light)' : undefined}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) {
            addSelectedNodeAllocation(allocation);
            return true;
          }

          return false;
        }}
        ref={ref}
      >
        <td className='pl-4 relative cursor-pointer w-10 text-center'>
          <Checkbox
            id={allocation.uuid}
            checked={isNodeAllocationSelected(allocation)}
            onChange={() => {
              if (isNodeAllocationSelected(allocation)) {
                removeSelectedNodeAllocation(allocation);
              } else {
                addSelectedNodeAllocation(allocation);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </td>

        <TableData>
          <Code>{allocation.uuid}</Code>
        </TableData>

        <TableData>
          <Code>
            {allocation.server ? (
              <NavLink
                to={`/admin/servers/${allocation.server.uuid}`}
                className='text-blue-400 hover:text-blue-200 hover:underline'
              >
                {allocation.server.name}
              </NavLink>
            ) : (
              '-'
            )}
          </Code>
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
    );
  }),
);

export default NodeAllocationRow;
