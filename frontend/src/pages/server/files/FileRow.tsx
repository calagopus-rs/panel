import Checkbox from '@/elements/inputs/Checkbox';
import { TableRow } from '@/elements/table/Table';
import Tooltip from '@/elements/Tooltip';
import { isEditableFile } from '@/lib/files';
import { bytesToString } from '@/lib/size';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useServerStore } from '@/stores/server';
import { faFolder, faFile } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { join } from 'pathe';
import { useNavigate } from 'react-router';

function FileTableRow({ file, children }: { file: DirectoryEntry; children: React.ReactNode }) {
  const navigate = useNavigate();

  const server = useServerStore(state => state.data);
  const { directory } = useServerStore(state => state.files);

  return isEditableFile(file.mime) || file.directory ? (
    <TableRow
      className="cursor-pointer"
      onClick={() => {
        navigate(`/server/${server.uuidShort}/files/${file.file ? 'edit' : 'directory'}${join(directory, file.name)}`);
      }}
    >
      {children}
    </TableRow>
  ) : (
    <TableRow>{children}</TableRow>
  );
}

export default ({ file }: { file: DirectoryEntry }) => {
  const { selectedFiles, addSelectedFile, removeSelectedFile } = useServerStore(state => state.files);

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

  return (
    <FileTableRow file={file}>
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
    </FileTableRow>
  );
};
