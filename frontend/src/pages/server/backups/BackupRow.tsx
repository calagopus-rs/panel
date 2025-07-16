import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import { TableRow } from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faEllipsis, faLock, faLockOpen, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { Dialog } from '@/elements/dialog';
import deleteBackup from '@/api/server/backups/deleteBackup';
import { bytesToString } from '@/lib/size';
import { formatTimestamp } from '@/lib/time';
import useWebsocketEvent, { SocketEvent } from '@/plugins/useWebsocketEvent';
import BackupEditDialog from './dialogs/BackupEditDialog';
import updateBackup from '@/api/server/backups/updateBackup';

export default ({ backup }: { backup: ServerBackup }) => {
  const { addToast } = useToast();
  const { server, removeBackup } = useServerStore();

  const [openDialog, setOpenDialog] = useState<'update' | 'unlock' | 'lock' | 'delete'>(null);
  const [progress, setProgress] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  if (!backup.completed) {
    useWebsocketEvent(SocketEvent.BACKUP_PROGRESS, (uuid, data) => {
      if (uuid !== backup.uuid) {
        return;
      }

      let wsData: any = null;
      try {
        wsData = JSON.parse(data);
      } catch {
        return;
      }

      setProgress(wsData.progress);
      setTotal(wsData.total);
    });
  }

  const doUpdate = (name: string, locked: boolean) => {
    updateBackup(server.uuid, backup.uuid, { name, locked })
      .then(() => {
        backup.name = name;
        backup.isLocked = locked;
        setOpenDialog(null);
        addToast('Backup updated.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
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
      <BackupEditDialog
        backup={backup}
        onUpdate={doUpdate}
        open={openDialog === 'update'}
        onClose={() => setOpenDialog(null)}
      />
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

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
              {backup.checksum && <Code>{backup.checksum}</Code>}
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
              {backup.completed ? bytesToString(backup.bytes) : `${bytesToString(progress)} / ${bytesToString(total)}`}
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
              {formatTimestamp(backup.created)}
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
              {backup.isLocked ? (
                <FontAwesomeIcon className="text-green-500" icon={faLock} />
              ) : (
                <FontAwesomeIcon className="text-red-500" icon={faLockOpen} />
              )}
            </td>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
