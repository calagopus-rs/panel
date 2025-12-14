import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import deleteSshKey from '@/api/me/ssh-keys/deleteSshKey.ts';
import Code from '@/elements/Code.tsx';
import ContextMenu from '@/elements/ContextMenu.tsx';
import CopyOnClick from '@/elements/CopyOnClick.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useUserStore } from '@/stores/user.ts';
import SshKeyEditModal from './modals/SshKeyEditModal.tsx';

export default function SshKeyRow({ sshKey }: { sshKey: UserSshKey }) {
  const { addToast } = useToast();
  const { removeSshKey } = useUserStore();

  const [openModal, setOpenModal] = useState<'edit' | 'delete' | null>(null);

  const doDelete = async () => {
    await deleteSshKey(sshKey.uuid)
      .then(() => {
        removeSshKey(sshKey);
        addToast('SSH key removed.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <SshKeyEditModal sshKey={sshKey} opened={openModal === 'edit'} onClose={() => setOpenModal(null)} />

      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title='Confirm SSH Key Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete
        <Code>{sshKey.name}</Code>
        from your account?
      </ConfirmationModal>

      <ContextMenu
        items={[
          { icon: faPencil, label: 'Edit', onClick: () => setOpenModal('edit'), color: 'gray' },
          { icon: faTrash, label: 'Delete', onClick: () => setOpenModal('delete'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <TableData>{sshKey.name}</TableData>

            <TableData>
              <CopyOnClick content={sshKey.fingerprint}>
                <Code>{sshKey.fingerprint}</Code>
              </CopyOnClick>
            </TableData>

            <TableData>
              <Tooltip label={formatDateTime(sshKey.created)}>{formatTimestamp(sshKey.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
}
