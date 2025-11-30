import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { NavLink } from 'react-router';
import deleteNodeMount from '@/api/admin/nodes/mounts/deleteNodeMount';
import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';

export default function NodeMountRow({ node, mount }: { node: Node; mount: NodeMount }) {
  const { addToast } = useToast();
  const { removeNodeMount } = useAdminStore();

  const [openModal, setOpenModal] = useState<'remove' | null>(null);

  const doRemove = async () => {
    await deleteNodeMount(node.uuid, mount.mount.uuid)
      .then(() => {
        removeNodeMount(mount);
        addToast('Node Mount removed.', 'success');
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
        title='Confirm Node Mount Removal'
        confirm='Remove'
        onConfirmed={doRemove}
      >
        Are you sure you want to remove the mount
        <Code>{mount.mount.name}</Code>
        from <Code>{node.name}</Code>?
      </ConfirmationModal>

      <ContextMenu
        items={[
          {
            icon: faTrash,
            label: 'Remove',
            onClick: () => setOpenModal('remove'),
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
