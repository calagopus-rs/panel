import { useEffect, useState } from 'react';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router';
import FileRow from './FileRow';
import { useServerStore } from '@/stores/server';
import loadDirectory from '@/api/server/files/loadDirectory';
import { FileBreadcrumbs } from './FileBreadcrumbs';
import Spinner from '@/elements/Spinner';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import FileActionBar from './FileActionBar';
import getBackup from '@/api/server/backups/getBackup';
import { Card, Group, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFileCirclePlus, faFolderPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import DirectoryNameModal from './modals/DirectoryNameModal';
import PullFileModal from './modals/PullFileModal';

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
    fileOperations,
  } = useServerStore();

  const [openModal, setOpenModal] = useState<'nameDirectory' | 'pullFile'>(null);
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

  return (
    <>
      <DirectoryNameModal opened={openModal === 'nameDirectory'} onClose={() => setOpenModal(null)} />
      <PullFileModal opened={openModal === 'pullFile'} onClose={() => setOpenModal(null)} />

      <FileActionBar />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Files
        </Title>
        {!browsingBackup && (
          <Group>
            <Button onClick={() => setOpenModal('nameDirectory')} color={'blue'}>
              <FontAwesomeIcon icon={faFolderPlus} className={'mr-2'} />
              New Directory
            </Button>
            <Button onClick={() => setOpenModal('pullFile')} color={'blue'}>
              <FontAwesomeIcon icon={faDownload} className={'mr-2'} />
              Pull
            </Button>
            <Button onClick={() => console.log('#Soon')} color={'blue'}>
              <FontAwesomeIcon icon={faUpload} className={'mr-2'} />
              Upload
            </Button>
            <Button
              onClick={() =>
                navigate(
                  `/server/${server.uuidShort}/files/new?${createSearchParams({ directory: browsingDirectory })}`,
                )
              }
              color={'blue'}
            >
              <FontAwesomeIcon icon={faFileCirclePlus} className={'mr-2'} />
              New File
            </Button>
          </Group>
        )}
      </Group>

      {fileOperations.entries().map(([uuid, operation]) => (
        <div key={uuid}>{JSON.stringify(operation, null, 2)}</div>
      ))}

      {loading ? (
        <Spinner.Centered />
      ) : (
        <>
          <Card>
            <FileBreadcrumbs path={decodeURIComponent(browsingDirectory)} browsingBackup={browsingBackup} />
          </Card>
          <ContextMenuProvider>
            <Table
              columns={['', 'Name', 'Size', 'Modified', '']}
              pagination={browsingEntries}
              onPageSelect={onPageSelect}
            >
              {browsingEntries.data.map((file) => (
                <FileRow key={file.name} file={file} />
              ))}
            </Table>
          </ContextMenuProvider>
        </>
      )}
    </>
  );
};
