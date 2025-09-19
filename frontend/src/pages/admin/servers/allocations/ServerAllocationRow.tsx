import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import ContextMenu from "@/elements/ContextMenu";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import ConfirmationModal from "@/elements/modals/ConfirmationModal";
import { formatAllocation } from "@/lib/server";
import { httpErrorToHuman } from "@/api/axios";
import deleteServerAllocation from "@/api/admin/servers/allocations/deleteServerAllocation";
import { useToast } from "@/providers/ToastProvider";
import { useAdminStore } from "@/stores/admin";

export default ({ server, allocation }: { server: AdminServer, allocation: ServerAllocation }) => {
  const { addToast } = useToast();
  const { removeServerAllocation } = useAdminStore();

  const [openModal, setOpenModal] = useState<'remove'>(null);

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
          { icon: faTrash, label: 'Remove', onClick: () => setOpenModal('remove'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow>
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
              <Tooltip label={formatDateTime(allocation.created)}>{formatTimestamp(allocation.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
