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
  faEllipsis,
  faCopy,
  faFileZipper,
  faEnvelopesBulk,
  faFileArrowDown,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { join } from 'pathe';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import FileDeleteDialog from './dialogs/FileDeleteDialog';
import deleteFiles from '@/api/server/files/deleteFiles';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFile from '@/api/server/files/decompressFile';
import FilePermissionsDialog from './dialogs/FilePermissionsDialog';
import chmodFiles from '@/api/server/files/chmodFiles';

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
  const server = useServerStore(state => state.server);
  const { browsingDirectory } = useServerStore();

  return isEditableFile(file.mime) || file.directory ? (
    <TableRow
      className="cursor-pointer"
      onContextMenu={onContextMenu}
      onClick={() => {
        navigate(
          `/server/${server.uuidShort}/files/${file.file ? 'edit' : 'directory'}/${encodeURIComponent(
            join(browsingDirectory, file.name),
          )}`,
        );
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
    addBrowsingEntry,
    removeBrowsingEntry,
    selectedFiles,
    addSelectedFile,
    removeSelectedFile,
  } = useServerStore();

  const [openDialog, setOpenDialog] = useState<'copy' | 'move' | 'permissions' | 'delete'>(null);

  const RowCheckbox = ({ id }: { id: string }) => {
    return (
      <div className="flex items-center">
        <Checkbox
          id={id}
          checked={selectedFiles.includes(id)}
          onChange={e => {
            e.stopPropagation();
            if (e.currentTarget.checked) {
              addSelectedFile(id);
            } else {
              removeSelectedFile(id);
            }
          }}
          onClick={e => e.stopPropagation()}
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
    }).catch(msg => {
      addToast(httpErrorToHuman(msg), 'error');
    });
  };

  const doDecompress = () => {
    decompressFile(server.uuid, browsingDirectory, file.name)
      .then(() => {
        reloadDirectory();
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doCompress = () => {
    compressFiles(server.uuid, browsingDirectory, [file.name])
      .then(entry => {
        addBrowsingEntry(entry);
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doDownload = () => {};

  const doDelete = () => {
    deleteFiles(server.uuid, browsingDirectory, [file.name])
      .then(() => {
        addToast(`File has been deleted.`, 'success');
        setOpenDialog(null);
        removeBrowsingEntry(file);
      })
      .catch(msg => {
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
      <FileDeleteDialog
        file={file}
        onDelete={doDelete}
        open={openDialog === 'delete'}
        onClose={() => setOpenDialog(null)}
      />

      <ContextMenu
        items={[
          { icon: faCopy, label: 'Copy', onClick: () => setOpenDialog('copy'), color: 'gray' },
          { icon: faAnglesUp, label: 'Move', onClick: () => setOpenDialog('move'), color: 'gray' },
          { icon: faFileShield, label: 'Permissions', onClick: () => setOpenDialog('permissions'), color: 'gray' },
          isArchiveType(file.mime)
            ? { icon: faEnvelopesBulk, label: 'Decompress', onClick: doDecompress, color: 'gray' }
            : { icon: faFileZipper, label: 'Compress', onClick: doCompress, color: 'gray' },
          file.file
            ? {
                icon: faFileArrowDown,
                label: 'Download',
                onClick: doDownload,
                color: 'gray',
              }
            : null,
          { icon: faTrash, label: 'Delete', onClick: () => setOpenDialog('delete'), color: 'red' },
        ]}
      >
        {({ openMenu }) => (
          <FileTableRow
            file={file}
            onContextMenu={e => {
              e.preventDefault();
              openMenu(e.pageX, e.pageY);
            }}
          >
            <td className="pl-6">
              <RowCheckbox id={file.name} />
            </td>

            <td className="px-6 text-sm text-neutral-100 text-left whitespace-nowrap" title={file.name}>
              {file.file ? (
                <FontAwesomeIcon className="mr-4 text-gray-400" icon={faFile} />
              ) : (
                <FontAwesomeIcon className="mr-4 text-gray-400" icon={faFolder} />
              )}
              {file.name}
            </td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{bytesToString(file.size)}</td>

            <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
              <Tooltip content={formatDateTime(file.modified)}>{formatTimestamp(file.modified)}</Tooltip>
            </td>

            <td
              className="relative"
              onClick={e => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                openMenu(rect.left, rect.bottom);
              }}
            >
              <FontAwesomeIcon icon={faEllipsis} className="cursor-pointer" />
            </td>
          </FileTableRow>
        )}
      </ContextMenu>
    </>
  );
};
