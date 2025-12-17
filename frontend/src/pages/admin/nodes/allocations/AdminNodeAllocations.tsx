import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MouseEvent as ReactMouseEvent, Ref, useEffect, useState } from 'react';
import getNodeAllocations from '@/api/admin/nodes/allocations/getNodeAllocations.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import SelectionArea from '@/elements/SelectionArea.tsx';
import Table from '@/elements/Table.tsx';
import { nodeAllocationTableColumns } from '@/lib/tableColumns.ts';
import { useKeyboardShortcuts } from '@/plugins/useKeyboardShortcuts.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import AllocationActionBar from './AllocationActionBar.tsx';
import NodeAllocationsCreateModal from './modals/NodeAllocationsCreateModal.tsx';
import NodeAllocationRow from './NodeAllocationRow.tsx';

export default function AdminNodeAllocations({ node }: { node: Node }) {
  const { nodeAllocations, setNodeAllocations, selectedNodeAllocations, setSelectedNodeAllocations } = useAdminStore();

  const [openModal, setOpenModal] = useState<'create' | null>(null);
  const [selectedNodeAllocationsPrevious, setSelectedNodeAllocationsPrevious] = useState(selectedNodeAllocations);

  const { loading, search, setSearch, setPage, refetch } = useSearchablePaginatedTable({
    fetcher: (page, search) => getNodeAllocations(node.uuid, page, search),
    setStoreData: setNodeAllocations,
  });

  const onSelectedStart = (event: ReactMouseEvent | MouseEvent) => {
    setSelectedNodeAllocationsPrevious(event.shiftKey ? selectedNodeAllocations : []);
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

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'a',
        modifiers: ['ctrlOrMeta'],
        callback: () => setSelectedNodeAllocations(nodeAllocations.data),
      },
      {
        key: 'Escape',
        modifiers: ['ctrlOrMeta'],
        callback: () => setSelectedNodeAllocations([]),
      },
    ],
    deps: [nodeAllocations.data],
  });

  return (
    <AdminContentContainer
      title='Node Allocations'
      titleOrder={2}
      search={search}
      setSearch={setSearch}
      contentRight={
        <Button onClick={() => setOpenModal('create')} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
          Create
        </Button>
      }
    >
      <NodeAllocationsCreateModal
        node={node}
        loadAllocations={refetch}
        opened={openModal === 'create'}
        onClose={() => setOpenModal(null)}
      />

      <AllocationActionBar node={node} loadAllocations={refetch} />

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
              {(innerRef: Ref<HTMLElement>) => (
                <NodeAllocationRow
                  key={allocation.uuid}
                  allocation={allocation}
                  ref={innerRef as Ref<HTMLTableRowElement>}
                />
              )}
            </SelectionArea.Selectable>
          ))}
        </Table>
      </SelectionArea>
    </AdminContentContainer>
  );
}
