import { faPencil, faStar, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import deleteAllocation from '@/api/server/allocations/deleteAllocation.ts';
import Code from '@/elements/Code.tsx';
import ContextMenu from '@/elements/ContextMenu.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import AllocationEditModal from './modals/AllocationEditModal.tsx';
import updateAllocation from '@/api/server/allocations/updateAllocation.ts';
import Tooltip from '@/elements/Tooltip.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';

export default function AllocationRow({ allocation }: { allocation: ServerAllocation }) {
  const { addToast } = useToast();
  const { server, allocations, removeAllocation, setAllocations, updateServer } = useServerStore();

  const [openModal, setOpenModal] = useState<'edit' | 'remove' | null>(null);

  const doSetPrimary = () => {
    updateAllocation(server.uuid, allocation.uuid, { primary: true })
      .then(() => {
        setAllocations({
          ...allocations,
          data: allocations.data.map((a) => ({
            ...a,
            isPrimary: a.uuid === allocation.uuid,
          })),
        });
        updateServer({ allocation });
        addToast('Allocation set as primary.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doUnsetPrimary = () => {
    updateAllocation(server.uuid, allocation.uuid, { primary: false })
      .then(() => {
        setAllocations({
          ...allocations,
          data: allocations.data.map((a) => ({
            ...a,
            isPrimary: false,
          })),
        });
        updateServer({ allocation: null });
        addToast('Allocation unset as primary.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

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
        opened={openModal === 'remove'}
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
          { icon: faStar, label: 'Set Primary', hidden: allocation.isPrimary, onClick: doSetPrimary, color: 'gray' },
          {
            icon: faStar,
            label: 'Unset Primary',
            hidden: !allocation.isPrimary,
            onClick: doUnsetPrimary,
            color: 'red',
          },
          { icon: faTrash, label: 'Remove', onClick: () => setOpenModal('remove'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <td className='relative w-10 text-center'>
              {allocation.isPrimary && (
                <Tooltip label='Primary'>
                  <FontAwesomeIcon icon={faStar} className='text-yellow-500 ml-3' />
                </Tooltip>
              )}
            </td>

            <TableData>
              <Code>{allocation.ipAlias ?? allocation.ip}</Code>
            </TableData>

            <TableData>
              <Code>{allocation.port}</Code>
            </TableData>

            <TableData>{allocation.notes ?? 'No notes'}</TableData>

            <TableData>
              <Tooltip label={formatDateTime(allocation.created)}>{formatTimestamp(allocation.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
}
