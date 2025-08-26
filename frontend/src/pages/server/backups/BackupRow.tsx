import { httpErrorToHuman } from '@/api/axios';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
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
import deleteBackup from '@/api/server/backups/deleteBackup';
import { bytesToString } from '@/lib/size';
import { formatTimestamp } from '@/lib/time';
import downloadBackup from '@/api/server/backups/downloadBackup';
import { createSearchParams, useNavigate } from 'react-router';
import { TableData, TableRow } from '@/elements/Table';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import BackupEditModal from './modals/BackupEditModal';
import BackupRestoreModal from './modals/BackupRestoreModal';
import Progress from '@/elements/Progress';
import { streamingArchiveFormatExtensionMapping } from '@/lib/files';

export default ({ backup }: { backup: ServerBackupWithProgress }) => {
  const { addToast } = useToast();
  const { server, removeBackup } = useServerStore();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'edit' | 'restore' | 'delete'>(null);

  const doDownload = (archiveFormat: StreamingArchiveFormat) => {
    downloadBackup(server.uuid, backup.uuid, archiveFormat)
      .then(({ url }) => {
        addToast('Download started.', 'success');
        window.open(url);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doDelete = () => {
    deleteBackup(server.uuid, backup.uuid)
      .then(() => {
        addToast('Backup deleted.', 'success');
        setOpenModal(null);
        removeBackup(backup);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <BackupEditModal backup={backup} opened={openModal === 'edit'} onClose={() => setOpenModal(null)} />
      <BackupRestoreModal backup={backup} opened={openModal === 'restore'} onClose={() => setOpenModal(null)} />
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Backup Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{backup.name}</Code> from this server?
      </ConfirmationModal>

      <ContextMenu
        items={[
          { icon: faPencil, label: 'Edit', onClick: () => setOpenModal('edit'), color: 'gray' },
          {
            icon: faShare,
            label: 'Browse',
            hidden: !backup.isBrowsable,
            onClick: () =>
              navigate(
                `/server/${server?.uuidShort}/files?${createSearchParams({
                  directory: `/.backups/${backup.uuid}`,
                })}`,
              ),
            color: 'gray',
          },
          {
            icon: faFileArrowDown,
            label: 'Download',
            onClick: backup.isStreaming ? () => doDownload('tar_gz') : undefined,
            color: 'gray',
            items: backup.isStreaming
              ? Object.entries(streamingArchiveFormatExtensionMapping).map(([mime, ext]) => ({
                  icon: faFileArrowDown,
                  label: `Download as ${ext}`,
                  onClick: () => doDownload(mime as StreamingArchiveFormat),
                  color: 'gray',
                }))
              : [],
          },
          {
            icon: faRotateLeft,
            label: 'Restore',
            onClick: () => setOpenModal('restore'),
            color: 'gray',
          },
          {
            icon: faTrash,
            label: 'Delete',
            hidden: backup.isLocked,
            onClick: () => setOpenModal('delete'),
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
            <TableData>{backup.name}</TableData>

            <TableData>{backup.checksum && <Code>{backup.checksum}</Code>}</TableData>

            {backup.completed ? (
              <TableData>{bytesToString(backup.bytes)}</TableData>
            ) : (
              <TableData colSpan={2}>
                <Progress value={((backup.progress?.progress || 0) / (backup.progress?.total || 0)) * 100} />
              </TableData>
            )}

            <TableData hidden={!backup.completed}>{backup.completed ? backup.files : null}</TableData>

            <TableData>{formatTimestamp(backup.created)}</TableData>

            <TableData>
              {backup.isLocked ? (
                <FontAwesomeIcon className={'text-green-500'} icon={faLock} />
              ) : (
                <FontAwesomeIcon className={'text-red-500'} icon={faLockOpen} />
              )}
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
