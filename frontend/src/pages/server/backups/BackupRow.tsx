import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import { TableRow } from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import {
  faFileArrowDown,
  faLock,
  faLockOpen,
  faPencil,
  faRotateLeft,
  faShare,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { Dialog } from '@/elements/dialog';
import deleteBackup from '@/api/server/backups/deleteBackup';
import { bytesToString } from '@/lib/size';
import { formatTimestamp } from '@/lib/time';
import BackupEditDialog from './dialogs/BackupEditDialog';
import updateBackup from '@/api/server/backups/updateBackup';
import downloadBackup from '@/api/server/backups/downloadBackup';
import restoreBackup from '@/api/server/backups/restoreBackup';
import BackupRestoreDialog from './dialogs/BackupRestoreDialog';
import { useNavigate, useParams } from 'react-router';

export default ({ backup }: { backup: ServerBackupWithProgress }) => {
  const { addToast } = useToast();
  const { server, removeBackup } = useServerStore();
  const navigate = useNavigate();
  const params = useParams<'id'>();

  const [openDialog, setOpenDialog] = useState<'edit' | 'restore' | 'delete'>(null);

  const doUpdate = (name: string, locked: boolean) => {
    updateBackup(server.uuid, backup.uuid, { name, locked })
      .then(() => {
        backup.name = name;
        backup.isLocked = locked;
        setOpenDialog(null);
        addToast('Backup updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doDownload = () => {
    downloadBackup(server.uuid, backup.uuid)
      .then(({ url }) => {
        addToast(`Download started.`, 'success');
        window.open(url);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doRestore = (truncateDirectory: boolean) => {
    restoreBackup(server.uuid, backup.uuid, { truncateDirectory })
      .then(() => {
        setOpenDialog(null);
        addToast('Restoring backup...', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doDelete = () => {
    deleteBackup(server.uuid, backup.uuid)
      .then(() => {
        addToast('Backup deleted.', 'success');
        setOpenDialog(null);
        removeBackup(backup);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <BackupEditDialog
        backup={backup}
        onUpdate={doUpdate}
        open={openDialog === 'edit'}
        onClose={() => setOpenDialog(null)}
      />
      <BackupRestoreDialog onRestore={doRestore} open={openDialog === 'restore'} onClose={() => setOpenDialog(null)} />
      <Dialog.Confirm
        open={openDialog === 'delete'}
        hideCloseIcon
        onClose={() => setOpenDialog(null)}
        title={'Confirm Backup Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{backup.name}</Code> from this server?
      </Dialog.Confirm>

      <ContextMenu
        items={[
          { icon: faPencil, label: 'Edit', onClick: () => setOpenDialog('edit'), color: 'gray' },
          {
            icon: faShare,
            label: 'Browse',
            hidden: !backup.isBrowsable,
            onClick: () => navigate(`/server/${params.id}/files?directory=%2F.backups%2F${backup.uuid}`),
            color: 'gray',
          },
          {
            icon: faFileArrowDown,
            label: 'Download',
            onClick: doDownload,
            color: 'gray',
          },
          {
            icon: faRotateLeft,
            label: 'Restore',
            onClick: () => setOpenDialog('restore'),
            color: 'gray',
          },
          { icon: faTrash, label: 'Delete', onClick: () => setOpenDialog('delete'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'} title={backup.name}>
              {backup.name}
            </td>

            <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
              {backup.checksum && <Code>{backup.checksum}</Code>}
            </td>

            <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
              {backup.completed
                ? bytesToString(backup.bytes)
                : backup.progress
                ? `${((backup.progress.progress / backup.progress.total) * 100).toFixed(2)}%`
                : null}
            </td>

            <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
              {formatTimestamp(backup.created)}
            </td>

            <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
              {backup.isLocked ? (
                <FontAwesomeIcon className={'text-green-500'} icon={faLock} />
              ) : (
                <FontAwesomeIcon className={'text-red-500'} icon={faLockOpen} />
              )}
            </td>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
