import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { Ref, useState } from 'react';
import { Group, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { useAdminStore } from '@/stores/admin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import NodeAllocationRow, { nodeAllocationTableColumns } from './NodeAllocationRow';
import getNodeAllocations from '@/api/admin/nodes/allocations/getNodeAllocations';
import NodeAllocationsCreateModal from './modals/NodeAllocationsCreateModal';
import SelectionArea from '@/elements/SelectionArea';
import Code from '@/elements/Code';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import deleteNodeAllocations from '@/api/admin/nodes/allocations/deleteNodeAllocations';
import TextInput from '@/elements/input/TextInput';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default ({ node }: { node: Node }) => {
  const { addToast } = useToast();
  const {
    nodeAllocations,
    setNodeAllocations,
    removeNodeAllocations,
    selectedNodeAllocations,
    setSelectedNodeAllocations,
  } = useAdminStore();

  const [openModal, setOpenModal] = useState<'create' | 'delete'>(null);
  const [selectedNodeAllocationsPrevious, setSelectedNodeAllocationsPrevious] = useState(selectedNodeAllocations);

  const { loading, search, setSearch, setPage, refetch } = useSearchablePaginatedTable({
    fetcher: (page, search) => getNodeAllocations(node.uuid, page, search),
    setStoreData: setNodeAllocations,
  });

  const onSelectedStart = (event: React.MouseEvent | MouseEvent) => {
    setSelectedNodeAllocationsPrevious(event.shiftKey ? selectedNodeAllocations : new Set());
  };

  const onSelected = (selected: NodeAllocation[]) => {
    setSelectedNodeAllocations([...selectedNodeAllocationsPrevious, ...selected]);
  };

  const doDelete = async () => {
    await deleteNodeAllocations(
      node.uuid,
      Array.from(selectedNodeAllocations).map((a) => a.uuid),
    )
      .then(() => {
        removeNodeAllocations(Array.from(selectedNodeAllocations));

        addToast('Node Mount deleted.', 'success');
        setSelectedNodeAllocations([]);
        setOpenModal(null);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <NodeAllocationsCreateModal
        node={node}
        loadAllocations={refetch}
        opened={openModal === 'create'}
        onClose={() => setOpenModal(null)}
      />
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Node Allocations Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete
        <Code>{selectedNodeAllocations.size}</Code>
        allocations from <Code>{node.name}</Code>?
      </ConfirmationModal>

      <Group justify={'space-between'} mb={'md'}>
        <Title order={2}>Node Allocations</Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => setOpenModal('delete')}
            color={'red'}
            leftSection={<FontAwesomeIcon icon={faTrash} />}
            disabled={selectedNodeAllocations.size < 1}
          >
            Delete {selectedNodeAllocations.size}
          </Button>
          <Button onClick={() => setOpenModal('create')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <SelectionArea
          onSelectedStart={onSelectedStart}
          onSelected={onSelected}
          className={'h-full'}
          disabled={!!openModal}
        >
          <Table columns={nodeAllocationTableColumns} pagination={nodeAllocations} onPageSelect={setPage}>
            {nodeAllocations.data.map((allocation) => (
              <SelectionArea.Selectable key={allocation.uuid} item={allocation}>
                {(innerRef: Ref<HTMLTableRowElement>) => <NodeAllocationRow allocation={allocation} ref={innerRef} />}
              </SelectionArea.Selectable>
            ))}
          </Table>
        </SelectionArea>
      )}
    </>
  );
};
