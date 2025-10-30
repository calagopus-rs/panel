import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faLock, faLockOpen, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import updateSubuser from '@/api/server/subusers/updateSubuser';
import deleteSubuser from '@/api/server/subusers/deleteSubuser';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import SubuserCreateOrUpdateModal from './modals/SubuserCreateOrUpdateModal';
import { TableData, TableRow } from '@/elements/Table';

export default ({ subuser }: { subuser: ServerSubuser }) => {
  const { addToast } = useToast();
  const { server, removeSubuser } = useServerStore();

  const [openModal, setOpenModal] = useState<'update' | 'remove'>(null);

  const doUpdate = (permissions: string[], ignoredFiles: string[]) => {
    updateSubuser(server.uuid, subuser.user.username, { permissions, ignoredFiles })
      .then(() => {
        subuser.permissions = permissions;
        subuser.ignoredFiles = ignoredFiles;
        setOpenModal(null);
        addToast('Subuser updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doRemove = async () => {
    await deleteSubuser(server.uuid, subuser.user.username)
      .then(() => {
        addToast('Subuser removed.', 'success');
        removeSubuser(subuser);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <SubuserCreateOrUpdateModal
        subuser={subuser}
        onUpdate={doUpdate}
        opened={openModal === 'update'}
        onClose={() => setOpenModal(null)}
      />

      <ConfirmationModal
        opened={openModal === 'remove'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Subuser Removal'}
        confirm={'Remove'}
        onConfirmed={doRemove}
      >
        Are you sure you want to remove <Code>{subuser.user.username}</Code> from this server?
      </ConfirmationModal>

      <ContextMenu
        items={[
          { icon: faPencil, label: 'Edit', onClick: () => setOpenModal('update'), color: 'gray' },
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
            <TableData>{subuser.user.username}</TableData>

            <TableData>
              {subuser.user.totpEnabled ? (
                <FontAwesomeIcon className={'text-green-500'} icon={faLock} />
              ) : (
                <FontAwesomeIcon className={'text-red-500'} icon={faLockOpen} />
              )}
            </TableData>

            <TableData>{subuser.permissions.length}</TableData>

            <TableData>{subuser.ignoredFiles.length}</TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
