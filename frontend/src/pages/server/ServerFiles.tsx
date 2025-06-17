import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
import CopyOnClick from '@/elements/CopyOnClick';
import Checkbox from '@/elements/inputs/Checkbox';
import Table, { ContentWrapper, Pagination, TableBody, TableHead, TableHeader, TableRow } from '@/elements/table/Table';
import { bytesToString } from '@/lib/size';
import { formatTimestamp } from '@/lib/time';
import { faFile, faFolder } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

const files = [
  {
    name: 'whitelist.json',
    type: 'file',
    size: 256,
    mimetype: 'application/json',
    modified_at: new Date('2025-06-06T08:16:56+00:00'),
  },
  {
    name: 'usercache.json',
    type: 'file',
    size: 530,
    mimetype: 'application/json',
    modified_at: new Date('2025-06-16T16:55:56+00:00'),
  },
  {
    name: 'server.properties',
    type: 'file',
    size: 1410,
    mimetype: 'text/plain; charset=utf-8',
    modified_at: new Date('2025-06-16T12:29:21+00:00'),
  },
  {
    name: 'server.jar',
    type: 'file',
    size: 635,
    mimetype: 'application/jar',
    modified_at: new Date('2025-06-06T11:33:59+00:00'),
  },
  {
    name: 'permissions.yml',
    type: 'file',
    size: 0,
    mimetype: 'text/plain',
    modified_at: new Date('2025-06-05T18:55:50+00:00'),
  },
  {
    name: 'ops.json',
    type: 'file',
    size: 268,
    mimetype: 'application/json',
    modified_at: new Date('2025-06-16T12:29:22+00:00'),
  },
  {
    name: 'minecraft-server.jar',
    type: 'file',
    size: 57269758,
    mimetype: 'application/jar',
    modified_at: new Date('2025-06-06T11:34:00+00:00'),
  },
  {
    name: 'help.yml',
    type: 'file',
    size: 0,
    mimetype: 'text/plain',
    modified_at: new Date('2025-06-05T18:55:44+00:00'),
  },
  {
    name: 'fabric-server-launcher.properties',
    type: 'file',
    size: 31,
    mimetype: 'text/plain; charset=utf-8',
    modified_at: new Date('2025-06-06T11:34:00+00:00'),
  },
  {
    name: 'fabric-installer.jar',
    type: 'file',
    size: 204454,
    mimetype: 'application/jar',
    modified_at: new Date('2025-03-16T23:44:18+00:00'),
  },
  {
    name: 'eula.txt',
    type: 'file',
    size: 9,
    mimetype: 'text/plain; charset=utf-8',
    modified_at: new Date('2025-06-05T18:55:32+00:00'),
  },
  {
    name: 'commands.yml',
    type: 'file',
    size: 104,
    mimetype: 'text/plain; charset=utf-8',
    modified_at: new Date('2025-06-05T18:57:11+00:00'),
  },
  {
    name: 'banned-players.json',
    type: 'file',
    size: 2,
    mimetype: 'application/json',
    modified_at: new Date('2025-06-16T12:29:22+00:00'),
  },
  {
    name: 'banned-ips.json',
    type: 'file',
    size: 2,
    mimetype: 'application/json',
    modified_at: new Date('2025-06-16T12:29:22+00:00'),
  },
  {
    name: '.cache',
    type: 'directory',
    size: 3,
    mimetype: 'inode/directory',
    modified_at: new Date('2025-06-08T13:22:33+00:00'),
  },
  {
    name: '.fabric',
    type: 'directory',
    size: 4,
    mimetype: 'inode/directory',
    modified_at: new Date('2025-06-08T13:22:19+00:00'),
  },
  {
    name: 'bundler',
    type: 'directory',
    size: 4,
    mimetype: 'inode/directory',
    modified_at: new Date('2025-06-08T13:22:19+00:00'),
  },
  {
    name: 'config',
    type: 'directory',
    size: 7,
    mimetype: 'inode/directory',
    modified_at: new Date('2025-06-16T12:21:47+00:00'),
  },
  {
    name: 'journeymap',
    type: 'directory',
    size: 3,
    mimetype: 'inode/directory',
    modified_at: new Date('2025-06-08T13:22:19+00:00'),
  },
  {
    name: 'libraries',
    type: 'directory',
    size: 8,
    mimetype: 'inode/directory',
    modified_at: new Date('2025-06-08T13:22:19+00:00'),
  },
  {
    name: 'logs',
    type: 'directory',
    size: 34,
    mimetype: 'inode/directory',
    modified_at: new Date('2025-06-17T03:42:40+00:00'),
  },
  {
    name: 'mods',
    type: 'directory',
    size: 10,
    mimetype: 'inode/directory',
    modified_at: new Date('2025-06-16T12:29:01+00:00'),
  },
  {
    name: 'versions',
    type: 'directory',
    size: 3,
    mimetype: 'inode/directory',
    modified_at: new Date('2025-06-08T13:22:19+00:00'),
  },
  {
    name: 'world',
    type: 'directory',
    size: 16,
    mimetype: 'inode/directory',
    modified_at: new Date('2025-06-16T16:57:00+00:00'),
  },
  {
    name: 'world_nether',
    type: 'directory',
    size: 7,
    mimetype: 'inode/directory',
    modified_at: new Date('2025-06-08T13:22:19+00:00'),
  },
  {
    name: 'world_the_end',
    type: 'directory',
    size: 7,
    mimetype: 'inode/directory',
    modified_at: new Date('2025-06-08T13:22:19+00:00'),
  },
];

const paginationDataset = {
  items: files,
  pagination: {
    total: files.length,
    count: files.length,
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  },
};

export default function ServerFiles() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const sortFiles = () => {
    return files.sort((a, b) => {
      // Prioritize directories
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;

      // Sort alphabetically (case-insensitive)
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  };

  const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.currentTarget.checked ? files.map(file => file.name) || [] : []);
  };

  const RowCheckbox = ({ id }: { id: string }) => {
    return (
      <Checkbox
        id={id}
        checked={selectedFiles.includes(id)}
        onChange={e => {
          if (e.currentTarget.checked) {
            setSelectedFiles(prev => [...prev, id]);
          } else {
            setSelectedFiles(prev => prev.filter(file => file !== id));
          }
        }}
      />
    );
  };

  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-header font-bold text-white">Files</h1>
        <div className="flex gap-2">
          <Button>Create new</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper checked={selectedFiles.length > 0} onSelectAllClick={onSelectAllClick}>
          <Pagination data={paginationDataset} onPageSelect={() => {}}>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <TableHead>
                  <TableHeader />
                  <TableHeader name={'Name'} />
                  <TableHeader name={'Size'} />
                  <TableHeader name={'Modified'} />
                </TableHead>

                <TableBody>
                  {sortFiles().map(file => (
                    <TableRow key={file.name}>
                      <td className="pl-6">
                        <RowCheckbox id={file.name} />
                      </td>

                      <td className="px-6 text-sm text-neutral-100 text-left whitespace-nowrap" title={file.name}>
                        {file.type === 'directory' ? (
                          <FontAwesomeIcon className="mr-4 text-gray-400" icon={faFolder} />
                        ) : (
                          <FontAwesomeIcon className="mr-4 text-gray-400" icon={faFile} />
                        )}
                        {file.name}
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        {bytesToString(file.size)}
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        {formatTimestamp(file.modified_at)}
                      </td>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          </Pagination>
        </ContentWrapper>
      </Table>
    </Container>
  );
}
