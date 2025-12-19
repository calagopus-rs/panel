import { faFileArrowDown, faLock, faLockOpen, faRotateLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { NavLink } from 'react-router';
import deleteNodeBackup from '@/api/admin/nodes/backups/deleteNodeBackup.ts';
import downloadNodeBackup from '@/api/admin/nodes/backups/downloadNodeBackup.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Code from '@/elements/Code.tsx';
import ContextMenu from '@/elements/ContextMenu.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import Spinner from '@/elements/Spinner.tsx';
import { TableData, TableRow } from '@/elements/Table.tsx';
import { streamingArchiveFormatLabelMapping } from '@/lib/enums.ts';
import { bytesToString } from '@/lib/size.ts';
import { formatTimestamp } from '@/lib/time.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';
import NodeBackupsRestoreModal from './modals/NodeBackupsRestoreModal.tsx';

export default function NodeBackupRow({ node, backup }: { node: Node; backup: AdminServerBackup }) {
  const { addToast } = useToast();
  const { removeNodeBackup } = useAdminStore();

  const [openModal, setOpenModal] = useState<'restore' | 'delete' | null>(null);

  const doDownload = (archiveFormat: StreamingArchiveFormat) => {
    downloadNodeBackup(node.uuid, backup.uuid, archiveFormat)
      .then(({ url }) => {
        addToast('Download started.', 'success');
        window.open(url, '_blank');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doDelete = async () => {
    await deleteNodeBackup(node.uuid, backup.uuid)
      .then(() => {
        addToast('Backup deleted.', 'success');
        setOpenModal(null);
        removeNodeBackup(backup);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <NodeBackupsRestoreModal
        node={node}
        backup={backup}
        opened={openModal === 'restore'}
        onClose={() => setOpenModal(null)}
      />

      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title='Confirm Backup Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{backup.name}</Code> from this node?
      </ConfirmationModal>

      <ContextMenu
        items={[
          {
            icon: faFileArrowDown,
            label: 'Download',
            onClick: !backup.isStreaming ? () => doDownload('tar_gz') : () => null,
            color: 'gray',
            items: backup.isStreaming
              ? Object.entries(streamingArchiveFormatLabelMapping).map(([mime, label]) => ({
                  icon: faFileArrowDown,
                  label: `Download as ${label}`,
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
            disabled: backup.isLocked,
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

            <TableData>
              <Code>
                {backup.server ? (
                  <NavLink
                    to={`/admin/servers/${backup.server.uuid}`}
                    className='text-blue-400 hover:text-blue-200 hover:underline'
                  >
                    {backup.server.name}
                  </NavLink>
                ) : (
                  '-'
                )}
              </Code>
            </TableData>

            <TableData>{backup.checksum && <Code>{backup.checksum}</Code>}</TableData>

            {backup.completed ? (
              <TableData>{bytesToString(backup.bytes)}</TableData>
            ) : (
              <TableData colSpan={2}>
                <Spinner />
              </TableData>
            )}

            <TableData>{backup.completed ? backup.files : null}</TableData>

            <TableData>{formatTimestamp(backup.created)}</TableData>

            <TableData>
              {backup.isLocked ? (
                <FontAwesomeIcon className='text-green-500' icon={faLock} />
              ) : (
                <FontAwesomeIcon className='text-red-500' icon={faLockOpen} />
              )}
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
}
