import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import Button from '@/elements/Button';
import { useToast } from '@/providers/ToastProvider';
import ActionBar from '@/elements/ActionBar';
import { useAdminStore } from '@/stores/admin';
import Code from '@/elements/Code';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import deleteNodeAllocations from '@/api/admin/nodes/allocations/deleteNodeAllocations';
import { httpErrorToHuman } from '@/api/axios';
import NodeAllocationsUpdateModal from './modals/NodeAllocationsUpdateModal';

export default function AllocationActionBar({ node, loadAllocations }: { node: Node; loadAllocations: () => void }) {
  const { addToast } = useToast();
  const { removeNodeAllocations, selectedNodeAllocations, setSelectedNodeAllocations } = useAdminStore();

  const [openModal, setOpenModal] = useState<'update' | 'delete'>(null);

  const doDelete = async () => {
    await deleteNodeAllocations(
      node.uuid,
      Array.from(selectedNodeAllocations).map((a) => a.uuid),
    )
      .then(({ deleted }) => {
        removeNodeAllocations(Array.from(selectedNodeAllocations));

        addToast(`${deleted} Node Allocation${deleted === 1 ? '' : 's'} deleted.`, 'success');
        setSelectedNodeAllocations([]);
        setOpenModal(null);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <NodeAllocationsUpdateModal
        node={node}
        loadAllocations={loadAllocations}
        opened={openModal === 'update'}
        onClose={() => setOpenModal(null)}
      />
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title='Confirm Node Allocations Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete
        <Code>{selectedNodeAllocations.size}</Code>
        allocations from <Code>{node.name}</Code>?
      </ConfirmationModal>

      <ActionBar opened={selectedNodeAllocations.size > 0}>
        <Button onClick={() => setOpenModal('update')}>
          <FontAwesomeIcon icon={faPen} className='mr-2' /> Update
        </Button>
        <Button color='red' onClick={() => setOpenModal('delete')}>
          <FontAwesomeIcon icon={faTrash} className='mr-2' /> Delete
        </Button>
      </ActionBar>
    </>
  );
}
