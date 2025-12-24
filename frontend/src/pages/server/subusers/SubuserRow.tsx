import { faLock, faLockOpen, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import deleteSubuser from '@/api/server/subusers/deleteSubuser.ts';
import updateSubuser from '@/api/server/subusers/updateSubuser.ts';
import Code from '@/elements/Code.tsx';
import ContextMenu from '@/elements/ContextMenu.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import SubuserCreateOrUpdateModal from './modals/SubuserCreateOrUpdateModal.tsx';

export default function SubuserRow({ subuser }: { subuser: ServerSubuser }) {
  const { addToast } = useToast();
  const { server, removeSubuser } = useServerStore();

  const [openModal, setOpenModal] = useState<'update' | 'remove' | null>(null);

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
        title='Confirm Subuser Removal'
        confirm='Remove'
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
            <TableData>
              <div className='size-5 aspect-square relative'>
                <img
                  src={subuser.user.avatar ?? '/icon.svg'}
                  alt={subuser.user.username} className='object-cover rounded-full select-none' />
              </div>
            </TableData>

            <TableData>{subuser.user.username}</TableData>

            <TableData>
              {subuser.user.totpEnabled ? (
                <FontAwesomeIcon className='text-green-500' icon={faLock} />
              ) : (
                <FontAwesomeIcon className='text-red-500' icon={faLockOpen} />
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
}
