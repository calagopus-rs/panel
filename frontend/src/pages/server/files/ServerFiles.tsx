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
import { Card, Group, Popover, Progress, Title, UnstyledButton } from '@mantine/core';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFileCirclePlus, faFolderPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import DirectoryNameModal from './modals/DirectoryNameModal';
import PullFileModal from './modals/PullFileModal';
import { load } from '@/lib/debounce';
import RingProgress from '@/elements/RingProgress';
import { Text } from '@mantine/core';

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
  const [averageOperationProgress, setAverageOperationProgress] = useState(0);

  useEffect(() => {
    setSelectedFiles([]);
    setBrowsingDirectory(searchParams.get('directory') || '/');
    setPage(Number(searchParams.get('page')) || 1);
  }, [searchParams]);

  const onPageSelect = (page: number) => {
    setSearchParams({ directory: browsingDirectory, page: page.toString() });
  };

  const loadDirectoryData = () => {
    load(true, setLoading);

    loadDirectory(server.uuid, browsingDirectory, page)
      .then((data) => {
        setBrowsingEntries(data);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  useEffect(() => {
    if (!browsingDirectory) return;

    loadDirectoryData();
  }, [browsingDirectory, page]);

  useEffect(() => {
    if (browsingDirectory?.startsWith('/.backups/') && !browsingBackup && !loading) {
      load(true, setLoading);

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
        .finally(() => load(false, setLoading));
    } else if (!browsingDirectory?.startsWith('/.backups/') && browsingBackup) {
      setBrowsingBackup(null);
    }
  }, [browsingDirectory, browsingBackup, loading]);

  useEffect(() => {
    if (fileOperations.size === 0) {
      setAverageOperationProgress(0);
    }

    let totalProgress = 0;
    let totalSize = 0;
    fileOperations.forEach((operation) => {
      totalProgress += operation.progress;
      totalSize += operation.total;
    });

    setAverageOperationProgress((totalProgress / totalSize) * 100);
  }, [Array.from(fileOperations)]);

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
            {fileOperations.size > 0 && (
              <Popover position={'bottom'} withArrow shadow={'md'}>
                <Popover.Target>
                  <UnstyledButton>
                    <RingProgress
                      size={50}
                      sections={[{ value: averageOperationProgress, color: 'blue' }]}
                      roundCaps
                      thickness={4}
                      label={
                        <Text c={'blue'} fw={700} ta={'center'} size={'xs'}>
                          {averageOperationProgress.toFixed(0)}%
                        </Text>
                      }
                    />
                  </UnstyledButton>
                </Popover.Target>
                <Popover.Dropdown>
                  {Array.from(fileOperations).map(([uuid, operation], index) => {
                    const progress = (operation.progress / operation.total) * 100;
                    return (
                      <div key={uuid} className={index === 0 ? '' : 'mt-2'}>
                        {operation.type === 'compress' ? (
                          <Text>Compressing {operation.path}</Text>
                        ) : operation.type === 'decompress' ? (
                          <Text>Decompressing {operation.path}</Text>
                        ) : operation.type === 'pull' ? (
                          <Text>Pulling {operation.path}</Text>
                        ) : null}
                        <Progress.Root size={'xl'}>
                          <Progress.Section value={progress} color={'blue'}>
                            <Progress.Label>{progress.toFixed(1)}%</Progress.Label>
                          </Progress.Section>
                        </Progress.Root>
                      </div>
                    );
                  })}
                </Popover.Dropdown>
              </Popover>
            )}
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
