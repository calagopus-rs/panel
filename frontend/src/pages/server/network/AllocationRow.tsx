import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import deleteAllocation from '@/api/server/allocations/deleteAllocation';
import Badge from '@/elements/Badge';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { TableData, TableRow } from '@/elements/Table';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import AllocationEditModal from './modals/AllocationEditModal';

export default function AllocationRow({ allocation }: { allocation: ServerAllocation }) {
  const { addToast } = useToast();
  const { server, removeAllocation } = useServerStore();

  const [openModal, setOpenModal] = useState<'edit' | 'delete'>(null);

  const doRemove = async () => {
    await deleteAllocation(server.uuid, allocation.uuid)
      .then(() => {
        removeAllocation(allocation);
        addToast('Allocation removed.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <AllocationEditModal allocation={allocation} opened={openModal === 'edit'} onClose={() => setOpenModal(null)} />
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title='Confirm Allocation Removal'
        confirm='Remove'
        onConfirmed={doRemove}
      >
        Are you sure you want to remove
        <Code>
          {allocation.ipAlias ?? allocation.ip}:{allocation.port}
        </Code>
        from this server?
      </ConfirmationModal>

      <ContextMenu
        items={[
          { icon: faPencil, label: 'Edit', onClick: () => setOpenModal('edit'), color: 'gray' },
          { icon: faTrash, label: 'Remove', onClick: () => setOpenModal('delete'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <TableData>
              <Code>{allocation.ipAlias ?? allocation.ip}</Code>
            </TableData>

            <TableData>
              <Code>{allocation.port}</Code>
            </TableData>

            <TableData>{allocation.notes ?? 'No notes'}</TableData>

            <TableData>{allocation.isPrimary ? <Badge>Primary</Badge> : <Badge color='gray'>Other</Badge>}</TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
}
