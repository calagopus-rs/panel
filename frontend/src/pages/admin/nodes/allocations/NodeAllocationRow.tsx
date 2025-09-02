import Code from '@/elements/Code';
import Checkbox from '@/elements/input/Checkbox';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useAdminStore } from '@/stores/admin';

export default ({ allocation, ref }: { allocation: NodeAllocation; ref: React.Ref<HTMLTableRowElement> }) => {
  const { selectedNodeAllocations, addSelectedNodeAllocation, removeSelectedNodeAllocation } = useAdminStore();

  return (
    <>
      <TableRow
        bg={selectedNodeAllocations.has(allocation) ? 'var(--mantine-color-blue-light)' : undefined}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) {
            addSelectedNodeAllocation(allocation);
            return true;
          }

          return false;
        }}
        ref={ref}
      >
        <td className={'pl-4 relative cursor-pointer w-10 text-center'}>
          <Checkbox
            id={allocation.uuid}
            checked={selectedNodeAllocations.has(allocation)}
            onChange={() => {
              if (selectedNodeAllocations.has(allocation)) {
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
