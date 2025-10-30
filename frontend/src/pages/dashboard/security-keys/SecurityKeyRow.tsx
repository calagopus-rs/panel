import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import { useToast } from '@/providers/ToastProvider';
import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { TableData, TableRow } from '@/elements/Table';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import SecurityKeyEditModal from './modals/SecurityKeyEditModal';
import { useUserStore } from '@/stores/user';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import deleteSecurityKey from '@/api/me/security-keys/deleteSecurityKey';

export default ({ securityKey }: { securityKey: UserSecurityKey }) => {
  const { addToast } = useToast();
  const { removeSecurityKey } = useUserStore();

  const [openModal, setOpenModal] = useState<'edit' | 'delete'>(null);

  const doDelete = async () => {
    await deleteSecurityKey(securityKey.uuid)
      .then(() => {
        removeSecurityKey(securityKey);
        addToast('Security key removed.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <SecurityKeyEditModal
        securityKey={securityKey}
        opened={openModal === 'edit'}
        onClose={() => setOpenModal(null)}
      />

      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Security Key Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete
        <Code>{securityKey.name}</Code>
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
            <TableData>{securityKey.name}</TableData>

            <TableData>
              {!securityKey.lastUsed ? (
                'N/A'
              ) : (
                <Tooltip label={formatDateTime(securityKey.lastUsed)}>{formatTimestamp(securityKey.lastUsed)}</Tooltip>
              )}
            </TableData>

            <TableData>
              <Tooltip label={formatDateTime(securityKey.created)}>{formatTimestamp(securityKey.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
