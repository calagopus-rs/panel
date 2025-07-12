import { getEmptyPaginationSet, httpErrorToHuman } from '@/api/axios';
import ContextMenu from '@/elements/ContextMenu';
import Checkbox from '@/elements/inputs/Checkbox';
import { TableRow } from '@/elements/table/Table';
import Tooltip from '@/elements/Tooltip';
import { isEditableFile } from '@/lib/files';
import { bytesToString } from '@/lib/size';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import {
  faFolder,
  faFile,
  faTrash,
  faAnglesUp,
  faArchive,
  faFileShield,
  faEllipsis,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { join } from 'pathe';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import FileDeleteDialog from './dialogs/FileDeleteDialog';
import archiveFiles from '@/api/server/files/archiveFiles';
import deleteFiles from '@/api/server/files/deleteFiles';

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
    <TableRow>{children}</TableRow>
  );
}

export default ({ file }: { file: DirectoryEntry }) => {
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

  const [openDialog, setOpenDialog] = useState<'copy' | 'move' | 'permissions' | 'archive' | 'delete'>(null);

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

  const doArchive = () => {
    archiveFiles(server.uuid, browsingDirectory, [file.name])
      .then(entry => {
        addBrowsingEntry(entry);
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

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
          { icon: faArchive, label: 'Archive', onClick: () => doArchive, color: 'gray' },
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

            <td className="relative">
              <FontAwesomeIcon
                icon={faEllipsis}
                className="cursor-pointer"
                onClick={e => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  openMenu(rect.left, rect.bottom);
                }}
              />
            </td>
          </FileTableRow>
        )}
      </ContextMenu>
    </>
  );
};
