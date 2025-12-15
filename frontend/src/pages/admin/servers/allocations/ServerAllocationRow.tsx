import { faPencil, faStar, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Stack } from '@mantine/core';
import { useState } from 'react';
import deleteServerAllocation from '@/api/admin/servers/allocations/deleteServerAllocation.ts';
import updateServerAllocation from '@/api/admin/servers/allocations/updateServerAllocation.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import Code from '@/elements/Code.tsx';
import ContextMenu from '@/elements/ContextMenu.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { formatAllocation } from '@/lib/server.ts';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';

export default function ServerAllocationRow({
  server,
  allocation,
}: {
  server: AdminServer;
  allocation: ServerAllocation;
}) {
  const { addToast } = useToast();
  const { serverAllocations, setServerAllocations, removeServerAllocation } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState<'edit' | 'remove' | null>(null);
  const [allocationNote, setAllocationNote] = useState(allocation.notes ?? '');

  const doEdit = () => {
    setLoading(true);

    updateServerAllocation(server.uuid, allocation.uuid, { notes: allocationNote })
      .then(() => {
        setServerAllocations({
          ...serverAllocations,
          data: serverAllocations.data.map((a) => (a.uuid === allocation.uuid ? { ...a, notes: allocationNote } : a)),
        });
        addToast('Allocation edited.', 'success');
        setOpenModal(null);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  const doSetPrimary = () => {
    updateServerAllocation(server.uuid, allocation.uuid, { primary: true })
      .then(() => {
        setServerAllocations({
          ...serverAllocations,
          data: serverAllocations.data.map((a) => ({
            ...a,
            isPrimary: a.uuid === allocation.uuid,
          })),
        });
        addToast('Allocation set as primary.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doUnsetPrimary = () => {
    updateServerAllocation(server.uuid, allocation.uuid, { primary: false })
      .then(() => {
        setServerAllocations({
          ...serverAllocations,
          data: serverAllocations.data.map((a) => ({
            ...a,
            isPrimary: false,
          })),
        });
        addToast('Allocation unset as primary.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doRemove = async () => {
    await deleteServerAllocation(server.uuid, allocation.uuid)
      .then(() => {
        removeServerAllocation(allocation);
        addToast('Allocation removed.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Modal title='Edit Server Allocation' onClose={() => setOpenModal(null)} opened={openModal === 'edit'}>
        <Stack>
          <TextInput
            withAsterisk
            label='Note'
            placeholder='Note'
            value={allocationNote}
            onChange={(e) => setAllocationNote(e.target.value)}
          />

          <Group mt='md'>
            <Button onClick={doEdit} loading={loading}>
              Edit
            </Button>
            <Button variant='default' onClick={() => setOpenModal(null)}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>

      <ConfirmationModal
        opened={openModal === 'remove'}
        onClose={() => setOpenModal(null)}
        title='Confirm Allocation Removal'
        confirm='Remove'
        onConfirmed={doRemove}
      >
        Are you sure you want to remove
        <Code>{formatAllocation(allocation)}</Code>?
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
            <TableData>{allocation.notes || 'N/A'}</TableData>
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
