import {
  faAnglesUp,
  faCopy,
  faEnvelopesBulk,
  faFile,
  faFileArrowDown,
  faFilePen,
  faFileShield,
  faFileZipper,
  faFolder,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { forwardRef, memo, useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import decompressFile from '@/api/server/files/decompressFile';
import downloadFiles from '@/api/server/files/downloadFiles';
import ContextMenu from '@/elements/ContextMenu';
import Checkbox from '@/elements/input/Checkbox';
import { TableData } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { streamingArchiveFormatLabelMapping } from '@/lib/enums';
import { isArchiveType } from '@/lib/files';
import { bytesToString } from '@/lib/size';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import ArchiveCreateModal from './modals/ArchiveCreateModal';
import FileCopyModal from './modals/FileCopyModal';
import FileDeleteModal from './modals/FileDeleteModal';
import FilePermissionsModal from './modals/FilePermissionsModal';
import FileRenameModal from './modals/FileRenameModal';
import { FileTableRow } from './FileTableRow';

interface FileRowProps {
  file: DirectoryEntry;
  setChildOpenModal: (open: boolean) => void;
}

const FileRow = memo(
  forwardRef<HTMLTableRowElement, FileRowProps>(function FileRow({ file, setChildOpenModal }, ref) {
    const { addToast } = useToast();
    const {
      server,
      browsingDirectory,
      browsingBackup,
      movingFileNames,
      setMovingFiles,
      isFileSelected,
      addSelectedFile,
      removeSelectedFile,
    } = useServerStore();

    const [openModal, setOpenModal] = useState<'rename' | 'copy' | 'permissions' | 'archive' | 'delete' | null>(null);

    useEffect(() => {
      setChildOpenModal(openModal !== null);
    }, [openModal, setChildOpenModal]);

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
              ref={ref}
              onContextMenu={(e) => {
                e.preventDefault();
                openMenu(e.clientX, e.clientY);
              }}
              onClick={(e) => {
                if ((e.ctrlKey || e.metaKey) && movingFileNames.size === 0) {
                  e.stopPropagation();
                  addSelectedFile(file);
                }
              }}
            >
              <td className='pl-4 relative cursor-pointer w-10 text-center py-2'>
                <Checkbox
                  id={file.name}
                  disabled={movingFileNames.size > 0}
                  checked={isFileSelected(file)}
                  onChange={() => {
                    if (isFileSelected(file)) {
                      removeSelectedFile(file);
                    } else {
                      addSelectedFile(file);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </td>

              <TableData>
                <span className='flex items-center gap-4 leading-[100%]'>
                  <FontAwesomeIcon className='text-gray-400' icon={file.file ? faFile : faFolder} />
                  {file.name}
                </span>
              </TableData>

              <TableData>
                <span className='flex items-center gap-4 leading-[100%]'>{bytesToString(file.size)}</span>
              </TableData>

              <TableData>
                <Tooltip label={formatDateTime(file.modified)}>
                  <span className='flex items-center gap-4 leading-[100%]'>{formatTimestamp(file.modified)}</span>
                </Tooltip>
              </TableData>

              <ContextMenu.Toggle openMenu={openMenu} />
            </FileTableRow>
          )}
        </ContextMenu>
      </>
    );
  }),
);

export default FileRow;
