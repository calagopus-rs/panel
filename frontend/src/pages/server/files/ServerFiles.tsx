import { FileObject } from '@/api/types';
import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Table, { ContentWrapper, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { urlPathToFilePath } from '@/lib/path';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import FileRow from './FileRow';
import { useServerStore } from '@/stores/server';
import { loadDirectory } from '@/api/server/files/loadDirectory';
import { FileBreadcrumbs } from './FileBreadcrumbs';

export default function ServerFiles() {
  const location = useLocation();
  const navigate = useNavigate();
  const server = useServerStore(state => state.data);
  const { directory, setDirectory, selectedFiles, setSelectedFiles } = useServerStore(state => state.files);

  const [fileList, setFileList] = useState<FileObject[]>([]);

  useEffect(() => {
    setSelectedFiles([]);
    setDirectory(urlPathToFilePath(location.pathname));
  }, [location]);

  useEffect(() => {
    loadDirectory(server.id, directory).then(setFileList);
  }, [directory]);

  const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.currentTarget.checked ? fileList.map(file => file.name) || [] : []);
  };

  const sortFiles = () => {
    return fileList.sort((a, b) => {
      // Prioritize directories
      if (!a.isFile && b.isFile) return -1;
      if (a.isFile && !b.isFile) return 1;

      // Sort alphabetically (case-insensitive)
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  };

  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-header font-bold text-white">Files</h1>
        <div className="flex gap-2">
          <Button style={Button.Styles.Gray}>New directory</Button>
          <Button>Upload</Button>
          <Button onClick={() => navigate(`/server/${server.id}/files/new${directory}`)}>New File</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper
          header={<FileBreadcrumbs path={directory} />}
          checked={selectedFiles.length > 0}
          onSelectAllClick={onSelectAllClick}
        >
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
                  <FileRow key={file.name} file={file} />
                ))}
              </TableBody>
            </table>
          </div>
        </ContentWrapper>
      </Table>
    </Container>
  );
}
