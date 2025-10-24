import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import { useToast } from '@/providers/ToastProvider';
import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { TableData, TableRow } from '@/elements/Table';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { useUserStore } from '@/stores/user';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import deleteApiKey from '@/api/me/api-keys/deleteApiKey';
import CopyOnClick from '@/elements/CopyOnClick';
import ApiKeyCreateOrUpdateModal from '@/pages/dashboard/api-keys/modals/ApiKeyCreateOrUpdateModal';

export default ({ apiKey }: { apiKey: UserApiKey }) => {
  const { addToast } = useToast();
  const { removeApiKey } = useUserStore();

  const [openModal, setOpenModal] = useState<'edit' | 'delete'>(null);

  const doDelete = async () => {
    await deleteApiKey(apiKey.uuid)
      .then(() => {
        removeApiKey(apiKey);
        addToast('API key removed.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <ApiKeyCreateOrUpdateModal
        contextApiKey={apiKey}
        opened={openModal === 'edit'}
        onClose={() => setOpenModal(null)}
      />
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm SSH Key Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete
        <Code>{apiKey.name}</Code>
        from your account?
      </ConfirmationModal>

      <ContextMenu
        items={[
          { icon: faPencil, label: 'Edit', onClick: () => setOpenModal('edit'), color: 'gray' },
          { icon: faTrash, label: 'Remove', onClick: () => setOpenModal('delete'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <TableData>{apiKey.name}</TableData>

            <TableData>
              <CopyOnClick content={apiKey.keyStart}>
                <Code>{apiKey.keyStart}</Code>
              </CopyOnClick>
            </TableData>

            <TableData>
              {apiKey.userPermissions.length} / {apiKey.serverPermissions.length} / {apiKey.adminPermissions.length}
            </TableData>

            <TableData>
              {!apiKey.lastUsed ? (
                'N/A'
              ) : (
                <Tooltip label={formatDateTime(apiKey.lastUsed)}>{formatTimestamp(apiKey.lastUsed)}</Tooltip>
              )}
            </TableData>

            <TableData>
              <Tooltip label={formatDateTime(apiKey.created)}>{formatTimestamp(apiKey.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
