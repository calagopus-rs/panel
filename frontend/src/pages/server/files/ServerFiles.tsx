import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Table, { ContentWrapper, NoItems, Pagination, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useEffect, useState } from 'react';
import { createSearchParams, useNavigate, useParams, useSearchParams } from 'react-router';
import FileRow from './FileRow';
import { useServerStore } from '@/stores/server';
import loadDirectory from '@/api/server/files/loadDirectory';
import { FileBreadcrumbs } from './FileBreadcrumbs';
import DirectoryNameDialog from './dialogs/DirectoryNameDialog';
import createDirectory from '@/api/server/files/createDirectory';
import { join } from 'pathe';
import Spinner from '@/elements/Spinner';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import FileActionBar from './FileActionBar';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    server,
    browsingDirectory,
    setBrowsingDirectory,
    browsingEntries,
    setBrowsingEntries,
    selectedFiles,
    setSelectedFiles,
  } = useServerStore();

  const [openDialog, setOpenDialog] = useState<'nameDirectory'>(null);
  const [loading, setLoading] = useState(browsingEntries.data.length === 0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSelectedFiles([]);
    setBrowsingDirectory(searchParams.get('directory') || '/');
    setPage(Number(searchParams.get('page')) || 1);
  }, [searchParams]);

  const onPageSelect = (page: number) => {
    setSearchParams({ directory: browsingDirectory, page: page.toString() });
  };

  const loadDirectoryData = () => {
    setLoading(true);

    loadDirectory(server.uuid, browsingDirectory, page)
      .then(data => {
        setBrowsingEntries(data);
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!browsingDirectory) return;

    loadDirectoryData();
  }, [browsingDirectory, page]);

  const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.currentTarget.checked ? browsingEntries.data || [] : []);
  };

  const makeDirectory = (name: string) => {
    createDirectory(server.uuid, browsingDirectory, name)
      .then(() => {
        setOpenDialog(null);
        setSearchParams({ directory: join(browsingDirectory, name) });
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Container>
      <DirectoryNameDialog
        onDirectoryNamed={(name: string) => makeDirectory(name)}
        open={openDialog === 'nameDirectory'}
        onClose={() => setOpenDialog(null)}
      />

      <FileActionBar />

      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-bold text-white">Files</h1>
        <div className="flex gap-2">
          <Button style={Button.Styles.Gray} onClick={() => setOpenDialog('nameDirectory')}>
            New directory
          </Button>
          <Button>Upload</Button>
          <Button
            onClick={() =>
              navigate(`/server/${server.uuidShort}/files/new?${createSearchParams({ directory: browsingDirectory })}`)
            }
          >
            New File
          </Button>
        </div>
      </div>
      <Table>
        <ContentWrapper
          header={<FileBreadcrumbs path={decodeURIComponent(browsingDirectory)} />}
          checked={selectedFiles.length > 0}
          onSelectAllClick={onSelectAllClick}
        >
          <Pagination data={browsingEntries} onPageSelect={onPageSelect}>
            <div className="overflow-x-auto">
              {loading ? (
                <Spinner.Centered />
              ) : browsingEntries.data.length === 0 ? (
                <NoItems />
              ) : (
                <table className="w-full table-auto">
                  <TableHead>
                    <TableHeader />
                    <TableHeader name="Name" />
                    <TableHeader name="Size" />
                    <TableHeader name="Modified" />
                    <TableHeader />
                  </TableHead>

                  <ContextMenuProvider>
                    <TableBody>
                      {browsingEntries.data.map(file => (
                        <FileRow key={file.name} file={file} reloadDirectory={loadDirectoryData} />
                      ))}
                    </TableBody>
                  </ContextMenuProvider>
                </table>
              )}
            </div>
          </Pagination>
        </ContentWrapper>
      </Table>
    </Container>
  );
};
