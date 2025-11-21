import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { NavLink } from 'react-router';
import deleteServerMount from '@/api/admin/servers/mounts/deleteServerMount';
import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';

export const serverMountTableColumns = ['ID', 'Name', 'Source', 'Target', 'Added', ''];

export default function ServerMountRow({ server, mount }: { server: AdminServer; mount: AdminServerMount }) {
  const { addToast } = useToast();
  const { removeServerMount } = useAdminStore();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const doDelete = async () => {
    await deleteServerMount(server.uuid, mount.mount.uuid)
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
        title='Confirm Server Mount Removal'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to remove the mount
        <Code>{mount.mount.name}</Code>
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
                to={`/admin/mounts/${mount.mount.uuid}`}
                className='text-blue-400 hover:text-blue-200 hover:underline'
              >
                <Code>{mount.mount.uuid}</Code>
              </NavLink>
            </TableData>
            <TableData>{mount.mount.name}</TableData>
            <TableData>
              <Code>{mount.mount.source}</Code>
            </TableData>
            <TableData>
              <Code>{mount.mount.target}</Code>
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
}
