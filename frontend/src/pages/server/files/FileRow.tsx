import { FileObject } from '@/api/types';
import Checkbox from '@/elements/inputs/Checkbox';
import { TableRow } from '@/elements/table/Table';
import { bytesToString } from '@/lib/size';
import { formatTimestamp } from '@/lib/time';
import { useServerStore } from '@/stores/server';
import { faFolder, faFile } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router';

export default function FileRow({ file }: { file: FileObject }) {
  const navigate = useNavigate();

  const { selectedFiles, addSelectedFile, removeSelectedFile } = useServerStore(state => state.files);

  const RowCheckbox = ({ id }: { id: string }) => {
    return (
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
    );
  };

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => {
        if (file.isFile) {
          navigate(`/server/test/files/edit/${file.name}`);
        } else {
          navigate(`/server/test/files/directory/${file.name}`);
        }
      }}
    >
      <td className="pl-6">
        <RowCheckbox id={file.name} />
      </td>

      <td className="px-6 text-sm text-neutral-100 text-left whitespace-nowrap" title={file.name}>
        {file.isFile ? (
          <FontAwesomeIcon className="mr-4 text-gray-400" icon={faFile} />
        ) : (
          <FontAwesomeIcon className="mr-4 text-gray-400" icon={faFolder} />
        )}
        {file.name}
      </td>

      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{bytesToString(file.size)}</td>

      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{formatTimestamp(file.modifiedAt)}</td>
    </TableRow>
  );
}
