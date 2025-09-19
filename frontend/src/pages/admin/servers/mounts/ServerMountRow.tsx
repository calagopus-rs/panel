import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import { useToast } from '@/providers/ToastProvider';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { TableData, TableRow } from '@/elements/Table';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useAdminStore } from '@/stores/admin';
import { NavLink } from 'react-router';
import deleteServerMount from "@/api/admin/servers/mounts/deleteServerMount";

export default ({ server, mount }: { server: AdminServer; mount: ServerMount }) => {
  const { addToast } = useToast();
  const { removeServerMount } = useAdminStore();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const doDelete = () => {
    deleteServerMount(server.uuid, mount.uuid)
      .then(() => {
        removeServerMount(mount);
        addToast('Node Mount deleted.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Server Mount Removal'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to remove the mount
        <Code>{mount.name}</Code>
        from <Code>{server.name}</Code>?
      </ConfirmationModal>

      <ContextMenu
        items={[
          {
            icon: faTrash,
            label: 'Remove',
            onClick: () => setOpenModal('delete'),
            color: 'red',
          },
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
              <NavLink
                to={`/admin/mounts/${mount.uuid}`}
                className={'text-blue-400 hover:text-blue-200 hover:underline'}
              >
                <Code>{mount.uuid}</Code>
              </NavLink>
            </TableData>
            <TableData>{mount.name}</TableData>
            <TableData>{mount.description}</TableData>
            <TableData>
              <Code>{mount.readOnly}</Code>
            </TableData>
            <TableData>
              <Code>{mount.target}</Code>
            </TableData>
            <TableData>
              <Tooltip label={formatDateTime(mount.created)}>{formatTimestamp(mount.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
