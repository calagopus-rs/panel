import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import { TableRow } from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faEllipsis, faLock, faLockOpen, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import SubuserCreateOrUpdateDialog from './dialogs/SubuserCreateOrUpdateDialog';
import updateSubuser from '@/api/server/subusers/updateSubuser';
import { Dialog } from '@/elements/dialog';
import deleteSubuser from '@/api/server/subusers/deleteSubuser';

export default ({ subuser }: { subuser: ServerSubuser }) => {
  const { addToast } = useToast();
  const { server, removeSubuser } = useServerStore();

  const [openDialog, setOpenDialog] = useState<'update' | 'remove'>(null);

  const doUpdate = (permissions: string[], ignoredFiles: string[]) => {
    updateSubuser(server.uuid, subuser.user.username, { permissions, ignoredFiles })
      .then(() => {
        subuser.permissions = permissions;
        subuser.ignoredFiles = ignoredFiles;
        setOpenDialog(null);
        addToast('Subuser updated.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doRemove = () => {
    deleteSubuser(server.uuid, subuser.user.username)
      .then(() => {
        addToast('Subuser removed.', 'success');
        removeSubuser(subuser);
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <SubuserCreateOrUpdateDialog
        subuser={subuser}
        onUpdated={doUpdate}
        open={openDialog === 'update'}
        onClose={() => setOpenDialog(null)}
      />
      <Dialog.Confirm
        open={openDialog === 'remove'}
        hideCloseIcon
        onClose={() => setOpenDialog(null)}
        title="Confirm Subuser Removal"
        confirm="Remove"
        onConfirmed={doRemove}
      >
        Are you sure you want to remove <Code>{subuser.user.username}</Code> from this server?
      </Dialog.Confirm>

      <ContextMenu
        items={[
          { icon: faPencil, label: 'Edit', onClick: () => setOpenDialog('update'), color: 'gray' },
          { icon: faTrash, label: 'Remove', onClick: () => setOpenDialog('remove'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={e => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <td className="px-6 text-sm text-neutral-100 text-left whitespace-nowrap">
              <Code>{subuser.user.id}</Code>
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={subuser.user.username}>
              {subuser.user.username}
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
              {subuser.user.totpEnabled ? (
                <FontAwesomeIcon className="text-green-500" icon={faLock} />
              ) : (
                <FontAwesomeIcon className="text-red-500" icon={faLockOpen} />
              )}
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{subuser.permissions.length}</td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{subuser.ignoredFiles.length}</td>

            <td
              className="relative cursor-pointer"
              onClick={e => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                openMenu(rect.left, rect.bottom);
              }}
            >
              <FontAwesomeIcon icon={faEllipsis} />
            </td>
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
