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
import deleteEggMount from "@/api/admin/eggs/mounts/deleteEggMount";

export default ({ nest, egg, mount }: { nest: Nest, egg: AdminNestEgg, mount: NodeMount }) => {
  const { addToast } = useToast();
  const { removeEggMount } = useAdminStore();

  const [openModal, setOpenModal] = useState<'remove'>(null);

  const doRemove = () => {
    deleteEggMount(nest.uuid, egg.uuid, mount.mount.uuid)
      .then(() => {
        removeEggMount(mount);
        addToast('Egg Mount deleted.', 'success');
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
        title={'Confirm Egg Mount Removal'}
        confirm={'Delete'}
        onConfirmed={doRemove}
      >
        Are you sure you want to remove the mount
        <Code>{mount.mount.name}</Code>
        from <Code>{egg.name}</Code>?
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
                className={'text-blue-400 hover:text-blue-200 hover:underline'}
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
};
