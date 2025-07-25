import { httpErrorToHuman } from '@/api/axios';
import ContextMenu from '@/elements/ContextMenu';
import Checkbox from '@/elements/inputs/Checkbox';
import { TableRow } from '@/elements/table/Table';
import Tooltip from '@/elements/Tooltip';
import { isArchiveType, isEditableFile } from '@/lib/files';
import { bytesToString } from '@/lib/size';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import {
  faFolder,
  faFile,
  faTrash,
  faAnglesUp,
  faFileShield,
  faCopy,
  faFileZipper,
  faEnvelopesBulk,
  faFileArrowDown,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { join } from 'pathe';
import { useState } from 'react';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router';
import FileDeleteDialog from './dialogs/FileDeleteDialog';
import deleteFiles from '@/api/server/files/deleteFiles';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFile from '@/api/server/files/decompressFile';
import FilePermissionsDialog from './dialogs/FilePermissionsDialog';
import chmodFiles from '@/api/server/files/chmodFiles';
import downloadFiles from '@/api/server/files/downloadFiles';
import ArchiveCreateDialog from './dialogs/ArchiveCreateDialog';
import { useGlobalStore } from '@/stores/global';

function FileTableRow({
  file,
  onContextMenu,
  children,
}: {
  file: DirectoryEntry;
  onContextMenu: (e: any) => void;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [_, setSearchParams] = useSearchParams();
  const server = useServerStore((state) => state.server);
  const { browsingDirectory } = useServerStore();
  const { settings } = useGlobalStore();

  return (isEditableFile(file.mime) && file.size <= settings.server.maxFileManagerViewSize) || file.directory ? (
    <TableRow
      className={'cursor-pointer'}
      onContextMenu={onContextMenu}
      onClick={() => {
        if (file.directory) {
          setSearchParams({
            directory: join(browsingDirectory, file.name),
          });
        } else {
          navigate(
            `/server/${server.uuidShort}/files/edit?${createSearchParams({
              directory: browsingDirectory,
              file: file.name,
            })}`,
          );
        }
      }}
    >
      {children}
    </TableRow>
  ) : (
    <TableRow onContextMenu={onContextMenu}>{children}</TableRow>
  );
}

export default ({ file, reloadDirectory }: { file: DirectoryEntry; reloadDirectory: () => void }) => {
  const { addToast } = useToast();
  const {
    server,
    browsingDirectory,
    browsingBackup,
    addBrowsingEntry,
    removeBrowsingEntry,
    selectedFiles,
    addSelectedFile,
    removeSelectedFile,
  } = useServerStore();

  const [openDialog, setOpenDialog] = useState<'copy' | 'move' | 'permissions' | 'archive' | 'delete'>(null);

  const RowCheckbox = ({ file }: { file: DirectoryEntry }) => {
    return (
      <div className={'flex items-center'}>
        <Checkbox
          id={file.name}
          checked={selectedFiles.includes(file)}
          onChange={(e) => {
            e.stopPropagation();
            if (e.currentTarget.checked) {
              addSelectedFile(file);
            } else {
              removeSelectedFile(file);
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  };

  const doCopy = () => {};

  const doMove = () => {};

  const doChmod = (mode: number) => {
    chmodFiles({
      uuid: server.uuid,
      root: browsingDirectory,
      files: [{ file: file.name, mode: mode.toString() }],
    })
      .then(() => {
        setOpenDialog(null);
        addToast('Permissions have been updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doUnarchive = () => {
    decompressFile(server.uuid, browsingDirectory, file.name)
      .then(() => {
        addToast('Archive has been decompressed.', 'success');
        reloadDirectory();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doArchive = (name: string, format: ArchiveFormat) => {
    compressFiles(server.uuid, {
      name,
      format,
      root: browsingDirectory,
      files: [file.name],
    })
      .then((entry) => {
        addToast('Archive has been created.', 'success');
        setOpenDialog(null);
        addBrowsingEntry(entry);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doDownload = () => {
    downloadFiles(server.uuid, browsingDirectory, [file.name], file.directory)
      .then(({ url }) => {
        addToast('Download started.', 'success');
        window.open(url);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doDelete = () => {
    deleteFiles(server.uuid, browsingDirectory, [file.name])
      .then(() => {
        addToast('File has been deleted.', 'success');
        setOpenDialog(null);
        removeBrowsingEntry(file);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <FilePermissionsDialog
        file={file}
        onChange={doChmod}
        open={openDialog === 'permissions'}
        onClose={() => setOpenDialog(null)}
      />
      <ArchiveCreateDialog open={openDialog === 'archive'} onClose={() => setOpenDialog(null)} onCreate={doArchive} />
      <FileDeleteDialog
        files={[file]}
        onDelete={doDelete}
        open={openDialog === 'delete'}
        onClose={() => setOpenDialog(null)}
      />

      <ContextMenu
        items={[
          {
            icon: faCopy,
            label: 'Copy',
            hidden: !!browsingBackup,
            onClick: () => setOpenDialog('copy'),
            color: 'gray',
          },
          {
            icon: faAnglesUp,
            label: 'Move',
            hidden: !!browsingBackup,
            onClick: () => setOpenDialog('move'),
            color: 'gray',
          },
          {
            icon: faFileShield,
            label: 'Permissions',
            hidden: !!browsingBackup,
            onClick: () => setOpenDialog('permissions'),
            color: 'gray',
          },
          isArchiveType(file.mime) && !browsingBackup
            ? {
                icon: faEnvelopesBulk,
                label: 'Unarchive',
                hidden: !!browsingBackup,
                onClick: doUnarchive,
                color: 'gray',
              }
            : {
                icon: faFileZipper,
                label: 'Archive',
                hidden: !!browsingBackup,
                onClick: () => setOpenDialog('archive'),
                color: 'gray',
              },
          {
            icon: faFileArrowDown,
            label: 'Download',
            onClick: doDownload,
            color: 'gray',
          },
          {
            icon: faTrash,
            label: 'Delete',
            hidden: !!browsingBackup,
            onClick: () => setOpenDialog('delete'),
            color: 'red',
          },
        ]}
      >
        {({ openMenu }) => (
          <FileTableRow
            file={file}
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <td className={'pl-6'}>
              <RowCheckbox file={file} />
            </td>

            <td className={'px-6 text-sm text-neutral-100 text-left whitespace-nowrap'} title={file.name}>
              {file.file ? (
                <FontAwesomeIcon className={'mr-4 text-gray-400'} icon={faFile} />
              ) : (
                <FontAwesomeIcon className={'mr-4 text-gray-400'} icon={faFolder} />
              )}
              {file.name}
            </td>

            <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{bytesToString(file.size)}</td>

            <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
              <Tooltip content={formatDateTime(file.modified)}>{formatTimestamp(file.modified)}</Tooltip>
            </td>

            <ContextMenu.Toggle openMenu={openMenu} />
          </FileTableRow>
        )}
      </ContextMenu>
    </>
  );
};
