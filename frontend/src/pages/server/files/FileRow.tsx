import { httpErrorToHuman } from '@/api/axios';
import ContextMenu from '@/elements/ContextMenu';
import Checkbox from '@/elements/input/Checkbox';
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
  faFilePen,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { join } from 'pathe';
import { useEffect, useState } from 'react';
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
import { streamingArchiveFormatLabelMapping } from '@/lib/enums';

function FileTableRow({
  file,
  onContextMenu,
  onClick,
  children,
  ref,
}: {
  file: DirectoryEntry;
  onContextMenu: (e: any) => void;
  onClick: (e: any) => boolean;
  children: React.ReactNode;
  ref: React.Ref<HTMLTableRowElement>;
}) {
  const navigate = useNavigate();
  const [_, setSearchParams] = useSearchParams();
  const server = useServerStore((state) => state.server);
  const { browsingDirectory, selectedFiles, movingFiles, movingFilesDirectory } = useServerStore();
  const { settings } = useGlobalStore();

  return (isEditableFile(file.mime) && file.size <= settings.server.maxFileManagerViewSize) || file.directory ? (
    <TableRow
      className={'cursor-pointer select-none'}
      bg={
        selectedFiles.has(file) ||
        (movingFilesDirectory === browsingDirectory && [...movingFiles].some((f) => f.name === file.name))
          ? 'var(--mantine-color-blue-light)'
          : undefined
      }
      onContextMenu={onContextMenu}
      onClick={(e) => {
        if (onClick(e)) return;

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
      ref={ref}
    >
      {children}
    </TableRow>
  ) : (
    <TableRow
      bg={
        selectedFiles.has(file) ||
        (movingFilesDirectory === browsingDirectory && [...movingFiles].some((f) => f.name === file.name))
          ? 'var(--mantine-color-blue-light)'
          : undefined
      }
      onContextMenu={onContextMenu}
      onClick={onClick}
      ref={ref}
    >
      {children}
    </TableRow>
  );
}

export default ({
  file,
  setChildOpenModal,
  ref,
}: {
  file: DirectoryEntry;
  setChildOpenModal: (open: boolean) => void;
  ref: React.Ref<HTMLTableRowElement>;
}) => {
  const { addToast } = useToast();
  const {
    server,
    browsingDirectory,
    browsingBackup,
    movingFiles,
    setMovingFiles,
    selectedFiles,
    addSelectedFile,
    removeSelectedFile,
  } = useServerStore();

  const [openModal, setOpenModal] = useState<'rename' | 'copy' | 'permissions' | 'archive' | 'delete'>(null);

  useEffect(() => {
    setChildOpenModal(openModal !== null);
  }, [openModal]);

  const doUnarchive = () => {
    decompressFile(server.uuid, browsingDirectory, file.name).catch((msg) => {
      addToast(httpErrorToHuman(msg), 'error');
    });
  };

  const doDownload = (archiveFormat: StreamingArchiveFormat) => {
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
              ? Object.entries(streamingArchiveFormatLabelMapping).map(([mime, label]) => ({
                  icon: faFileArrowDown,
                  label: `Download as ${label}`,
                  onClick: () => doDownload(mime as StreamingArchiveFormat),
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
            onClick={(e) => {
              if ((e.ctrlKey || e.metaKey) && movingFiles.size === 0) {
                addSelectedFile(file);
                return true;
              }

              return false;
            }}
            ref={ref}
          >
            <td className={'pl-4 relative cursor-pointer w-10 text-center'}>
              <Checkbox
                id={file.name}
                disabled={movingFiles.size > 0}
                checked={selectedFiles.has(file)}
                onChange={() => {
                  if (selectedFiles.has(file)) {
                    removeSelectedFile(file);
                  } else {
                    addSelectedFile(file);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </td>

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
              <Tooltip label={formatDateTime(file.modified)}>{formatTimestamp(file.modified)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </FileTableRow>
        )}
      </ContextMenu>
    </>
  );
};
