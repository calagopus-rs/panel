import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import { TableRow } from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faEllipsis, faLock, faLockOpen, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import updateSubuser from '@/api/server/subusers/updateSubuser';
import { Dialog } from '@/elements/dialog';
import deleteSubuser from '@/api/server/subusers/deleteSubuser';
import deleteBackup from '@/api/server/backups/deleteBackup';
import { bytesToString } from '@/lib/size';
import { formatTimestamp } from '@/lib/time';

export default ({ backup }: { backup: ServerBackup }) => {
  const { addToast } = useToast();
  const { server, removeBackup } = useServerStore();

  const [openDialog, setOpenDialog] = useState<'update' | 'delete'>(null);

  const doUpdate = (permissions: string[], ignoredFiles: string[]) => {
    // updateSubuser(server.uuid, subuser.user.username, { permissions, ignoredFiles })
    //   .then(() => {
    //     subuser.permissions = permissions;
    //     subuser.ignoredFiles = ignoredFiles;
    //     setOpenDialog(null);
    //     addToast('Subuser updated.', 'success');
    //   })
    //   .catch(msg => {
    //     addToast(httpErrorToHuman(msg), 'error');
    //   });
  };

  const doRemove = () => {
    deleteBackup(server.uuid, backup.uuid)
      .then(() => {
        addToast('Backup deleted.', 'success');
        removeBackup(backup);
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      {/* <SubuserCreateOrUpdateDialog
        subuser={subuser}
        onUpdated={doUpdate}
        open={openDialog === 'update'}
        onClose={() => setOpenDialog(null)}
      /> */}
      <Dialog.Confirm
        open={openDialog === 'delete'}
        hideCloseIcon
        onClose={() => setOpenDialog(null)}
        title="Confirm Backup Deletion"
        confirm="Remove"
        onConfirmed={doRemove}
      >
        Are you sure you want to delete <Code>{backup.name}</Code> from this server?
      </Dialog.Confirm>

      <ContextMenu
        items={[
          { icon: faPencil, label: 'Edit', onClick: () => setOpenDialog('update'), color: 'gray' },
          { icon: faTrash, label: 'Delete', onClick: () => setOpenDialog('delete'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={e => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={backup.name}>
              {backup.name}
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{bytesToString(backup.bytes)}</td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
              {formatTimestamp(backup.created)}
            </td>

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
