import { httpErrorToHuman } from '@/api/axios';
import deleteAllocation from '@/api/server/allocations/deleteAllocation';
import updateAllocation from '@/api/server/allocations/updateAllocation';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import { Dialog } from '@/elements/dialog';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import AllocationEditDialog from './dialogs/AllocationEditDialog';
import { TableData, TableRow } from '@/elements/table/TableNew';
import Badge from '@/elements/Badge';

export default ({ allocation }: { allocation: ServerAllocation }) => {
  const { addToast } = useToast();
  const { server, removeAllocation } = useServerStore();

  const [openDialog, setOpenDialog] = useState<'edit' | 'delete'>(null);

  const doUpdate = (notes: string, primary: boolean) => {
    updateAllocation(server.uuid, allocation.uuid, { notes, primary })
      .then(() => {
        allocation.notes = notes;
        allocation.isPrimary = primary;
        setOpenDialog(null);
        addToast('Allocation updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doRemove = () => {
    deleteAllocation(server.uuid, allocation.uuid)
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
      <AllocationEditDialog
        allocation={allocation}
        onUpdate={doUpdate}
        open={openDialog === 'edit'}
        onClose={() => setOpenDialog(null)}
      />
      <Dialog.Confirm
        opened={openDialog === 'delete'}
        onClose={() => setOpenDialog(null)}
        title={'Confirm Allocation Removal'}
        confirm={'Remove'}
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

            <TableData>{allocation.isPrimary ? <Badge>Primary</Badge> : <Badge color={'gray'}>Other</Badge>}</TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
