import { useEffect, useState } from 'react';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router';
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
import getBackup from '@/api/server/backups/getBackup';
import { Card, Group, Title } from '@mantine/core';
import NewButton from '@/elements/button/NewButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCirclePlus, faFolderPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import TableNew from '@/elements/table/TableNew';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    server,
    browsingDirectory,
    setBrowsingDirectory,
    browsingBackup,
    setBrowsingBackup,
    browsingEntries,
    setBrowsingEntries,
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
      .then((data) => {
        setBrowsingEntries(data);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!browsingDirectory) return;

    loadDirectoryData();
  }, [browsingDirectory, page]);

  useEffect(() => {
    if (browsingDirectory?.startsWith('/.backups/') && !browsingBackup && !loading) {
      setLoading(true);

      let backupUuid = browsingDirectory.slice('/.backups/'.length);
      if (backupUuid.includes('/')) {
        backupUuid = backupUuid.slice(0, backupUuid.indexOf('/'));
      }

      getBackup(server.uuid, backupUuid)
        .then((data) => {
          setBrowsingBackup(data);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => setLoading(false));
    } else if (!browsingDirectory?.startsWith('/.backups/') && browsingBackup) {
      setBrowsingBackup(null);
    }
  }, [browsingDirectory, browsingBackup, loading]);

  const makeDirectory = (name: string) => {
    createDirectory(server.uuid, browsingDirectory, name)
      .then(() => {
        setOpenDialog(null);
        setSearchParams({ directory: join(browsingDirectory, name) });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <DirectoryNameDialog
        onDirectoryName={(name: string) => makeDirectory(name)}
        open={openDialog === 'nameDirectory'}
        onClose={() => setOpenDialog(null)}
      />

      <FileActionBar />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Files
        </Title>
        {!browsingBackup && (
          <Group>
            <NewButton onClick={() => setOpenDialog('nameDirectory')} color={'blue'}>
              <FontAwesomeIcon icon={faFolderPlus} className={'mr-2'} />
              New Directory
            </NewButton>
            <NewButton onClick={() => console.log('#Soon')} color={'blue'}>
              <FontAwesomeIcon icon={faUpload} className={'mr-2'} />
              Upload
            </NewButton>
            <NewButton
              onClick={() =>
                navigate(
                  `/server/${server.uuidShort}/files/new?${createSearchParams({ directory: browsingDirectory })}`,
                )
              }
              color={'blue'}
            >
              <FontAwesomeIcon icon={faFileCirclePlus} className={'mr-2'} />
              New File
            </NewButton>
          </Group>
        )}
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <>
          <Card>
            <FileBreadcrumbs path={decodeURIComponent(browsingDirectory)} browsingBackup={browsingBackup} />
          </Card>
          <ContextMenuProvider>
            <TableNew
              columns={['', 'Name', 'Size', 'Modified', '']}
              pagination={browsingEntries}
              onPageSelect={onPageSelect}
            >
              {browsingEntries.data.map((file) => (
                <FileRow key={file.name} file={file} reloadDirectory={loadDirectoryData} />
              ))}
            </TableNew>
          </ContextMenuProvider>
        </>
      )}
    </>
  );
};
