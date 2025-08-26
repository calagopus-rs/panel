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
import { Card, Group, Popover, Title, UnstyledButton } from '@mantine/core';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFileCirclePlus, faFolderPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import DirectoryNameModal from './modals/DirectoryNameModal';
import PullFileModal from './modals/PullFileModal';
import { load } from '@/lib/debounce';
import RingProgress from '@/elements/RingProgress';
import { Text } from '@mantine/core';
import classNames from 'classnames';
import cancelOperation from '@/api/server/files/cancelOperation';
import CloseButton from '@/elements/CloseButton';
import Progress from '@/elements/Progress';
import SelectionArea from '@/elements/SelectionArea';

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
    selectedFiles,
    setSelectedFiles,
    movingFiles,
    fileOperations,
    removeFileOperation,
  } = useServerStore();

  const [openModal, setOpenModal] = useState<'nameDirectory' | 'pullFile'>(null);
  const [loading, setLoading] = useState(browsingEntries.data.length === 0);
  const [page, setPage] = useState(1);
  const [selectedFilesPrevious, setSelectedFilesPrevious] = useState(selectedFiles);
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

  const doCancelOperation = (uuid: string) => {
    removeFileOperation(uuid);

    cancelOperation(server.uuid, uuid)
      .then(() => {
        addToast('Operation cancelled', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const onSelectedStart = (event: React.MouseEvent | MouseEvent) => {
    setSelectedFilesPrevious(event.shiftKey ? selectedFiles : []);
  };

  const onSelected = (selected: DirectoryEntry[]) => {
    setSelectedFiles([...new Set([...selectedFilesPrevious, ...selected])]);
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
              <Popover position={'bottom-start'} shadow={'md'}>
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
                <Popover.Dropdown className={'md:min-w-xl max-w-screen'}>
                  {Array.from(fileOperations).map(([uuid, operation], index) => {
                    const progress = (operation.progress / operation.total) * 100;

                    return (
                      <div key={uuid} className={classNames(index === 0 ? '' : 'mt-2', 'flex flex-row items-center')}>
                        <div className={'flex flex-col flex-grow'}>
                          <p className={'break-all mb-1'}>
                            {operation.type === 'compress'
                              ? `Compressing ${operation.path}`
                              : operation.type === 'decompress'
                                ? `Decompressing ${operation.path}`
                                : operation.type === 'pull'
                                  ? `Pulling ${operation.path}`
                                  : null}
                          </p>
                          <Progress value={progress} />
                        </div>
                        <CloseButton className={'ml-3'} onClick={() => doCancelOperation(uuid)} />
                      </div>
                    );
                  })}
                </Popover.Dropdown>
              </Popover>
            )}
            <Button
              onClick={() => setOpenModal('nameDirectory')}
              color={'blue'}
              leftSection={<FontAwesomeIcon icon={faFolderPlus} />}
            >
              New Directory
            </Button>
            <Button
              onClick={() => setOpenModal('pullFile')}
              color={'blue'}
              leftSection={<FontAwesomeIcon icon={faDownload} />}
            >
              Pull
            </Button>
            <Button
              onClick={() => console.log('#Soon')}
              color={'blue'}
              leftSection={<FontAwesomeIcon icon={faUpload} />}
            >
              Upload
            </Button>
            <Button
              onClick={() =>
                navigate(
                  `/server/${server.uuidShort}/files/new?${createSearchParams({ directory: browsingDirectory })}`,
                )
              }
              color={'blue'}
              leftSection={<FontAwesomeIcon icon={faFileCirclePlus} />}
            >
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
          <SelectionArea
            onSelectedStart={onSelectedStart}
            onSelected={onSelected}
            className={'h-full'}
            disabled={movingFiles.length > 0}
          >
            <ContextMenuProvider>
              <Table
                columns={['', 'Name', 'Size', 'Modified', '']}
                pagination={browsingEntries}
                onPageSelect={onPageSelect}
              >
                {browsingEntries.data.map((file) => (
                  <SelectionArea.Selectable key={file.name} item={file}>
                    {(innerRef) => <FileRow key={file.name} file={file} ref={innerRef} />}
                  </SelectionArea.Selectable>
                ))}
              </Table>
            </ContextMenuProvider>
          </SelectionArea>
        </>
      )}
    </>
  );
};
