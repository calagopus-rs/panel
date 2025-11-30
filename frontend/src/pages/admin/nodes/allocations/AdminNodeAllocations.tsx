import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { MouseEvent as ReactMouseEvent, Ref, useEffect, useState } from 'react';
import getNodeAllocations from '@/api/admin/nodes/allocations/getNodeAllocations';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import SelectionArea from '@/elements/SelectionArea';
import Table from '@/elements/Table';
import { nodeAllocationTableColumns } from '@/lib/tableColumns';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';
import AllocationActionBar from './AllocationActionBar';
import NodeAllocationsCreateModal from './modals/NodeAllocationsCreateModal';
import NodeAllocationRow from './NodeAllocationRow';

export default function AdminNodeAllocations({ node }: { node: Node }) {
  const { nodeAllocations, setNodeAllocations, selectedNodeAllocations, setSelectedNodeAllocations } = useAdminStore();

  const [openModal, setOpenModal] = useState<'create' | null>(null);
  const [selectedNodeAllocationsPrevious, setSelectedNodeAllocationsPrevious] = useState(selectedNodeAllocations);

  const { loading, search, setSearch, setPage, refetch } = useSearchablePaginatedTable({
    fetcher: (page, search) => getNodeAllocations(node.uuid, page, search),
    setStoreData: setNodeAllocations,
  });

  const onSelectedStart = (event: ReactMouseEvent | MouseEvent) => {
    setSelectedNodeAllocationsPrevious(event.shiftKey ? selectedNodeAllocations : new Set());
  };

  const onSelected = (selected: NodeAllocation[]) => {
    setSelectedNodeAllocations([...selectedNodeAllocationsPrevious, ...selected]);
  };

  useEffect(() => {
    setSelectedNodeAllocations([]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if ((event.ctrlKey || event.metaKey) && event.key === 'Escape') {
        event.preventDefault();
        setSelectedNodeAllocations([]);
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'a' && !isInputFocused) {
        event.preventDefault();
        setSelectedNodeAllocations(nodeAllocations.data);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nodeAllocations.data]);

  return (
    <>
      <NodeAllocationsCreateModal
        node={node}
        loadAllocations={refetch}
        opened={openModal === 'create'}
        onClose={() => setOpenModal(null)}
      />

      <AllocationActionBar node={node} loadAllocations={refetch} />

      <Group justify='space-between' align='start' mb='md'>
        <Title order={2}>Node Allocations</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('create')} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create
          </Button>
        </Group>
      </Group>

      <SelectionArea onSelectedStart={onSelectedStart} onSelected={onSelected} disabled={!!openModal}>
        <Table
          columns={nodeAllocationTableColumns}
          loading={loading}
          pagination={nodeAllocations}
          onPageSelect={setPage}
          allowSelect={false}
        >
          {nodeAllocations.data.map((allocation) => (
            <SelectionArea.Selectable key={allocation.uuid} item={allocation}>
              {(innerRef: Ref<HTMLTableRowElement>) => <NodeAllocationRow allocation={allocation} ref={innerRef} />}
            </SelectionArea.Selectable>
          ))}
        </Table>
      </SelectionArea>
    </>
  );
}
