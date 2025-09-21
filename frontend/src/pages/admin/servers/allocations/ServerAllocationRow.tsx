import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import ContextMenu from "@/elements/ContextMenu";
import { faPencil, faStar, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import ConfirmationModal from "@/elements/modals/ConfirmationModal";
import { formatAllocation } from "@/lib/server";
import { httpErrorToHuman } from "@/api/axios";
import deleteServerAllocation from "@/api/admin/servers/allocations/deleteServerAllocation";
import { useToast } from "@/providers/ToastProvider";
import { useAdminStore } from "@/stores/admin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import updateServerAllocation from "@/api/admin/servers/allocations/updateServerAllocation";
import Modal from "@/elements/modals/Modal";
import { Group, Stack } from "@mantine/core";
import Button from "@/elements/Button";
import TextInput from "@/elements/input/TextInput";
import { load } from "@/lib/debounce";

export default ({ server, allocation }: { server: AdminServer, allocation: ServerAllocation }) => {
  const { addToast } = useToast();
  const { serverAllocations, setServerAllocations, removeServerAllocation } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState<'edit' | 'remove'>(null);
  const [allocationNote, setAllocationNote] = useState(allocation.notes ?? '');

  const doEdit = () => {
    load(true, setLoading);

    updateServerAllocation(server.uuid, allocation.uuid, { notes: allocationNote })
      .then(() => {
        setServerAllocations({
          ...serverAllocations,
          data: serverAllocations.data.map((a) => (a.uuid === allocation.uuid ? { ...a, notes: allocationNote } : a)),
        })
        addToast('Allocation edited.', 'success');
        setOpenModal(null);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
    .finally(() => {
      load(false, setLoading);
    });
  }

  const doSetPrimary = () => {
    updateServerAllocation(server.uuid, allocation.uuid, { primary: true })
      .then(() => {
        setServerAllocations({
          ...serverAllocations,
          data: serverAllocations.data.map((a) => (a.uuid === allocation.uuid ? { ...a, primary: true } : a)),
        })
        addToast('Allocation set as primary.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doRemove = () => {
    deleteServerAllocation(server.uuid, allocation.uuid)
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
      <Modal title={'Edit Server Allocation'} onClose={() => setOpenModal(null)} opened={openModal === 'edit'}>
        <Stack>
          <TextInput
            withAsterisk
            label={'Note'}
            placeholder={'Note'}
            value={allocationNote}
            onChange={(e) => setAllocationNote(e.target.value)}
          />

          <Group mt={'md'}>
            <Button onClick={doEdit} loading={loading}>
              Edit
            </Button>
            <Button variant={'default'} onClick={() => setOpenModal(null)}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
      <ConfirmationModal
        opened={openModal === 'remove'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Allocation Removal'}
        confirm={'Remove'}
        onConfirmed={doRemove}
      >
        Are you sure you want to remove
        <Code>{formatAllocation(allocation)}</Code>
        ?
      </ConfirmationModal>

      <ContextMenu
        items={[
          { icon: faPencil, label: 'Edit', onClick: () => setOpenModal('edit'), color: 'gray' },
          { icon: faStar, label: 'Set Primary', onClick: doSetPrimary, color: 'gray' },
          { icon: faTrash, label: 'Remove', onClick: () => setOpenModal('remove'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow>
            <td className={'relative cursor-pointer w-10 text-center'}>
              {allocation.isPrimary && (
                <Tooltip label={'Primary'}>
                  <FontAwesomeIcon icon={faStar} className={'text-yellow-500'} />
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
            <TableData>
              {allocation.notes ?? 'N/A'}
            </TableData>
            <TableData>
              <Tooltip label={formatDateTime(allocation.created)}>{formatTimestamp(allocation.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
