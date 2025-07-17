import { httpErrorToHuman } from '@/api/axios';
import deleteAllocation from '@/api/server/allocations/deleteAllocation';
import updateAllocation from '@/api/server/allocations/updateAllocation';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import { Dialog } from '@/elements/dialog';
import { TableRow } from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import AllocationEditDialog from './dialogs/AllocationEditDialog';

export default ({ allocation }: { allocation: ServerAllocation }) => {
  const { addToast } = useToast();
  const { server, removeAllocation } = useServerStore();

  const [openDialog, setOpenDialog] = useState<'edit' | 'delete'>(null);

  const doUpdate = (notes: string, primary: boolean) => {
    updateAllocation(server.uuid, allocation.id, { notes, primary })
      .then(() => {
        allocation.notes = notes;
        allocation.isPrimary = primary;
        setOpenDialog(null);
        addToast('Allocation updated.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doRemove = () => {
    deleteAllocation(server.uuid, allocation.id)
      .then(() => {
        removeAllocation(allocation);
        addToast('Allocation removed.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <AllocationEditDialog
        allocation={allocation}
        onUpdate={doUpdate}
        open={openDialog === 'edit'}
        onClose={() => setOpenDialog(null)}
      />
      <Dialog.Confirm
        open={openDialog === 'delete'}
        hideCloseIcon
        onClose={() => setOpenDialog(null)}
        title="Confirm Allocation Removal"
        confirm="Remove"
        onConfirmed={doRemove}
      >
        Are you sure you want to remove
        <Code>
          {allocation.ipAlias ?? allocation.ip}:{allocation.port}
        </Code>
        from this server?
      </Dialog.Confirm>

      <ContextMenu
        items={[
          { icon: faPencil, label: 'Edit', onClick: () => setOpenDialog('edit'), color: 'gray' },
          { icon: faTrash, label: 'Remove', onClick: () => setOpenDialog('delete'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={e => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
              <Code>{allocation.ipAlias ?? allocation.ip}</Code>
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
              <Code>{allocation.port}</Code>
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={allocation.notes}>
              {allocation.notes ?? 'No notes'}
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
              {allocation.isPrimary ? 'Primary' : 'Custom'}
            </td>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
