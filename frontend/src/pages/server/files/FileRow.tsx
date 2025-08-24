import { httpErrorToHuman } from '@/api/axios';
import ContextMenu from '@/elements/ContextMenu';
import Checkbox from '@/elements/input/Checkbox';
import Tooltip from '@/elements/Tooltip';
import { archiveFormatExtensionMapping, isArchiveType, isEditableFile } from '@/lib/files';
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
  faFilePen,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { join } from 'pathe';
import { useState } from 'react';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router';
import decompressFile from '@/api/server/files/decompressFile';
import downloadFiles from '@/api/server/files/downloadFiles';
import { useGlobalStore } from '@/stores/global';
import { TableData, TableRow } from '@/elements/Table';
import ArchiveCreateModal from './modals/ArchiveCreateModal';
import FileCopyModal from './modals/FileCopyModal';
import FileDeleteModal from './modals/FileDeleteModal';
import FilePermissionsModal from './modals/FilePermissionsModal';
import FileRenameModal from './modals/FileRenameModal';

export default ({ file }: { file: DirectoryEntry }) => {
  const { addToast } = useToast();
  const {
    server,
    browsingDirectory,
    browsingBackup,
    selectedFiles,
    addSelectedFile,
    removeSelectedFile,
    movingFiles,
    setMovingFiles,
  } = useServerStore();

  const [openModal, setOpenModal] = useState<'rename' | 'copy' | 'permissions' | 'archive' | 'delete'>(null);

  const RowCheckbox = ({ file, disabled }: { file: DirectoryEntry; disabled: boolean }) => {
    return (
      <Checkbox
        id={file.name}
        disabled={disabled}
        checked={selectedFiles.includes(file)}
        onChange={(e) => {
          e.preventDefault();
          if (e.currentTarget.checked) {
            addSelectedFile(file);
          } else {
            removeSelectedFile(file);
          }
        }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  };

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
        bg={selectedFiles.includes(file) ? 'var(--mantine-color-blue-light)' : undefined}
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
      <TableRow
        bg={selectedFiles.includes(file) ? 'var(--mantine-color-blue-light)' : undefined}
        onContextMenu={onContextMenu}
      >
        {children}
      </TableRow>
    );
  }

  const doUnarchive = () => {
    decompressFile(server.uuid, browsingDirectory, file.name).catch((msg) => {
      addToast(httpErrorToHuman(msg), 'error');
    });
  };

  const doDownload = (archiveFormat: ArchiveFormat) => {
    downloadFiles(server.uuid, browsingDirectory, [file.name], file.directory, archiveFormat)
      .then(({ url }) => {
        addToast('Download started.', 'success');
        window.open(url);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <FileCopyModal file={file} opened={openModal === 'copy'} onClose={() => setOpenModal(null)} />
      <FileRenameModal file={file} opened={openModal === 'rename'} onClose={() => setOpenModal(null)} />
      <FilePermissionsModal file={file} opened={openModal === 'permissions'} onClose={() => setOpenModal(null)} />
      <ArchiveCreateModal files={[file]} opened={openModal === 'archive'} onClose={() => setOpenModal(null)} />
      <FileDeleteModal files={[file]} opened={openModal === 'delete'} onClose={() => setOpenModal(null)} />

      <ContextMenu
        items={[
          {
            icon: faFilePen,
            label: 'Rename',
            hidden: !!browsingBackup,
            onClick: () => setOpenModal('rename'),
          },
          {
            icon: faCopy,
            label: 'Copy',
            hidden: !!browsingBackup || file.directory,
            onClick: () => setOpenModal('copy'),
            color: 'gray',
          },
          {
            icon: faAnglesUp,
            label: 'Move',
            hidden: !!browsingBackup,
            onClick: () => setMovingFiles([file]),
            color: 'gray',
          },
          {
            icon: faFileShield,
            label: 'Permissions',
            hidden: !!browsingBackup,
            onClick: () => setOpenModal('permissions'),
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
                onClick: () => setOpenModal('archive'),
                color: 'gray',
              },
          {
            icon: faFileArrowDown,
            label: 'Download',
            onClick: file.file ? () => doDownload('tar_gz') : undefined,
            color: 'gray',
            items: file.directory
              ? Object.entries(archiveFormatExtensionMapping)
                  .filter(([mime, _]) => mime !== 'seven_zip')
                  .map(([mime, ext]) => ({
                    icon: faFileArrowDown,
                    label: `Download as ${ext}`,
                    onClick: () => doDownload(mime as ArchiveFormat),
                    color: 'gray',
                  }))
              : [],
          },
          {
            icon: faTrash,
            label: 'Delete',
            hidden: !!browsingBackup,
            onClick: () => setOpenModal('delete'),
            color: 'red',
          },
        ]}
      >
        {({ openMenu }) => (
          <FileTableRow
            file={file}
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e.clientX, e.clientY);
            }}
          >
            <TableData>
              <RowCheckbox file={file} disabled={movingFiles.length > 0} />
            </TableData>

            <TableData>
              {file.file ? (
                <FontAwesomeIcon className={'mr-4 text-gray-400'} icon={faFile} />
              ) : (
                <FontAwesomeIcon className={'mr-4 text-gray-400'} icon={faFolder} />
              )}
              {file.name}
            </TableData>

            <TableData>{bytesToString(file.size)}</TableData>

            <TableData>
              <Tooltip content={formatDateTime(file.modified)}>{formatTimestamp(file.modified)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </FileTableRow>
        )}
      </ContextMenu>
    </>
  );
};
