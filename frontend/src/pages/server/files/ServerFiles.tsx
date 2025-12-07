import {
  faChevronDown,
  faDownload,
  faFileCirclePlus,
  faFileUpload,
  faFolderOpen,
  faFolderPlus,
  faServer,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, Group, Popover, Text, Title, UnstyledButton } from '@mantine/core';
import { Ref, useEffect, useRef, useState } from 'react';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router';
import { httpErrorToHuman } from '@/api/axios';
import getBackup from '@/api/server/backups/getBackup';
import cancelOperation from '@/api/server/files/cancelOperation';
import loadDirectory from '@/api/server/files/loadDirectory';
import Button from '@/elements/Button';
import CloseButton from '@/elements/CloseButton';
import ContextMenu, { ContextMenuProvider } from '@/elements/ContextMenu';
import Progress from '@/elements/Progress';
import RingProgress from '@/elements/RingProgress';
import SelectionArea from '@/elements/SelectionArea';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import FileActionBar from './FileActionBar';
import FileBreadcrumbs from './FileBreadcrumbs';
import FileRow from './FileRow';
import DirectoryNameModal from './modals/DirectoryNameModal';
import PullFileModal from './modals/PullFileModal';
import SftpDetailsModal from './modals/SftpDetailsModal';
import { useFileUpload } from '@/plugins/useFileUpload';

export default function ServerFiles() {
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

  const [openModal, setOpenModal] = useState<'sftpDetails' | 'nameDirectory' | 'pullFile'>(null);
  const [childOpenModal, setChildOpenModal] = useState(false);
  const [loading, setLoading] = useState(browsingEntries.data.length === 0);
  const [page, setPage] = useState(1);
  const [selectedFilesPrevious, setSelectedFilesPrevious] = useState(selectedFiles);
  const [averageOperationProgress, setAverageOperationProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadingFiles,
    uploadFiles,
    cancelFileUpload,
    cancelFolderUpload,
    aggregatedUploadProgress,
    handleFileSelect,
    handleFolderSelect,
  } = useFileUpload(server.uuid, browsingDirectory, () => loadDirectoryData());

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
    setSelectedFilesPrevious(event.shiftKey ? selectedFiles : new Set());
  };

  const onSelected = (selected: DirectoryEntry[]) => {
    setSelectedFiles([...selectedFilesPrevious, ...selected]);
  };

  const traverseDirectory = async (
    entry: FileSystemDirectoryEntry,
    files: File[],
    path: string = '',
  ): Promise<void> => {
    return new Promise((resolve) => {
      const reader = entry.createReader();

      const readEntries = () => {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve();
            return;
          }

          for (const entry of entries) {
            if (entry.isFile) {
              const fileEntry = entry as FileSystemFileEntry;
              await new Promise<void>((resolveFile) => {
                fileEntry.file((file) => {
                  const newFile = new File([file], `${path}/${file.name}`, {
                    type: file.type,
                    lastModified: file.lastModified,
                  });
                  files.push(newFile);
                  resolveFile();
                });
              });
            } else if (entry.isDirectory) {
              await traverseDirectory(entry as FileSystemDirectoryEntry, files, `${path}/${entry.name}`);
            }
          }

          readEntries();
        });
      };

      readEntries();
    });
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
    dragCounterRef.current = 0;

    if (browsingBackup) return;

    const items = Array.from(e.dataTransfer?.items || []);
    const files: File[] = [];

    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry?.();

        if (entry) {
          if (entry.isDirectory) {
            await traverseDirectory(entry as FileSystemDirectoryEntry, files, entry.name);
          } else {
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        } else {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    }

    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (browsingBackup) return;

      dragCounterRef.current++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [browsingBackup, uploadFiles]);

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

  useEffect(() => {
    if (fileOperations.size === 0 && uploadingFiles.size === 0) {
      setAverageOperationProgress(0);
      return;
    }

    let totalProgress = 0;
    let totalSize = 0;

    fileOperations.forEach((operation) => {
      if (operation.total === 0) return;
      totalProgress += operation.progress;
      totalSize += operation.total;
    });

    uploadingFiles.forEach((file) => {
      totalProgress += file.uploaded;
      totalSize += file.size;
    });

    if (totalSize > 0) {
      setAverageOperationProgress((totalProgress / totalSize) * 100);
    }
  }, [Array.from(fileOperations), uploadingFiles]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if ((event.ctrlKey || event.metaKey) && event.key === 'Escape') {
        event.preventDefault();
        setSelectedFiles([]);
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'a' && !isInputFocused) {
        event.preventDefault();
        setSelectedFiles(browsingEntries.data);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [browsingEntries.data]);

  const hasOperations = fileOperations.size > 0 || uploadingFiles.size > 0;

  return (
    <div className='h-fit relative'>
      <input
        ref={fileInputRef}
        type='file'
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e, fileInputRef)}
      />
      <input
        ref={folderInputRef}
        type='file'
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFolderSelect(e, folderInputRef)}
        {...{ webkitdirectory: '', directory: '' }}
      />

      <SftpDetailsModal opened={openModal === 'sftpDetails'} onClose={() => setOpenModal(null)} />
      <DirectoryNameModal opened={openModal === 'nameDirectory'} onClose={() => setOpenModal(null)} />
      <PullFileModal opened={openModal === 'pullFile'} onClose={() => setOpenModal(null)} />

      <FileActionBar />

      <Group justify='space-between' align='start' mb='md'>
        <Title order={1} c='white'>
          Files
        </Title>
        {!browsingBackup && (
          <Group>
            {hasOperations && (
              <Popover position='bottom-start' shadow='md'>
                <Popover.Target>
                  <UnstyledButton>
                    <RingProgress
                      size={50}
                      sections={[
                        {
                          value: averageOperationProgress,
                          color: uploadingFiles.size > 0 ? 'green' : 'blue',
                        },
                      ]}
                      roundCaps
                      thickness={4}
                      label={
                        <Text c={uploadingFiles.size > 0 ? 'green' : 'blue'} fw={700} ta='center' size='xs'>
                          {averageOperationProgress.toFixed(0)}%
                        </Text>
                      }
                    />
                  </UnstyledButton>
                </Popover.Target>
                <Popover.Dropdown className='md:min-w-xl max-w-screen max-h-96 overflow-y-auto'>
                  {Array.from(aggregatedUploadProgress).map(([folderName, info]) => {
                    const progress = info.totalSize > 0 ? (info.uploadedSize / info.totalSize) * 100 : 0;
                    const statusText =
                      info.pendingCount > 0
                        ? `Uploading folder: ${folderName} (${info.fileCount - info.pendingCount}/${
                            info.fileCount
                          } files)`
                        : `Uploading folder: ${folderName} (${info.fileCount} files)`;

                    return (
                      <div key={folderName} className='flex flex-row items-center mb-3'>
                        <div className='flex flex-col grow'>
                          <p className='break-all mb-1'>{statusText}</p>
                          <Progress value={progress} />
                        </div>
                        <CloseButton className='ml-3' onClick={() => cancelFolderUpload(folderName)} />
                      </div>
                    );
                  })}

                  {Array.from(uploadingFiles).map(([key, file]) => {
                    if (aggregatedUploadProgress.size > 0 && file.fileName.includes('/')) {
                      return null;
                    }

                    return (
                      <div key={key} className='flex flex-row items-center mb-2'>
                        <div className='flex flex-col grow'>
                          <p className='break-all mb-1 text-sm'>
                            {file.status === 'pending' ? 'Waiting: ' : 'Uploading: '}
                            {file.fileName}
                          </p>
                          <Progress value={file.progress} />
                        </div>
                        <CloseButton className='ml-3' onClick={() => cancelFileUpload(key)} />
                      </div>
                    );
                  })}

                  {Array.from(fileOperations).map(([uuid, operation]) => {
                    const progress = (operation.progress / operation.total) * 100;

                    return (
                      <div key={uuid} className='flex flex-row items-center mb-2'>
                        <div className='flex flex-col grow'>
                          <p className='break-all mb-1'>
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
                        <CloseButton className='ml-3' onClick={() => doCancelOperation(uuid)} />
                      </div>
                    );
                  })}
                </Popover.Dropdown>
              </Popover>
            )}
            <Button
              variant='outline'
              leftSection={<FontAwesomeIcon icon={faServer} />}
              onClick={() => setOpenModal('sftpDetails')}
            >
              SFTP Details
            </Button>
            <ContextMenuProvider>
              <ContextMenu
                items={[
                  {
                    icon: faFileCirclePlus,
                    label: 'File from Editor',
                    onClick: () =>
                      navigate(
                        `/server/${server.uuidShort}/files/new?${createSearchParams({ directory: browsingDirectory })}`,
                      ),
                    color: 'gray',
                  },
                  {
                    icon: faFolderPlus,
                    label: 'Directory',
                    onClick: () => setOpenModal('nameDirectory'),
                    color: 'gray',
                  },
                  {
                    icon: faDownload,
                    label: 'File from Pull',
                    onClick: () => setOpenModal('pullFile'),
                    color: 'gray',
                  },
                  {
                    icon: faFileUpload,
                    label: 'File from Upload',
                    onClick: () => fileInputRef.current?.click(),
                    color: 'gray',
                  },
                  {
                    icon: faFolderOpen,
                    label: 'Directory from Upload',
                    onClick: () => folderInputRef.current?.click(),
                    color: 'gray',
                  },
                ]}
              >
                {({ openMenu }) => (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      openMenu(rect.left, rect.bottom);
                    }}
                    color='blue'
                    rightSection={<FontAwesomeIcon icon={faChevronDown} />}
                  >
                    New
                  </Button>
                )}
              </ContextMenu>
            </ContextMenuProvider>
          </Group>
        )}
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <>
          {isDragging && !browsingBackup && (
            <div className='fixed w-screen h-screen left-0 top-0 inset-0 z-100 flex items-center justify-center backdrop-blur-md bg-black/20 pointer-events-auto'>
              <div className='pointer-events-none'>
                <div className='bg-gray-800 rounded-lg p-8 shadow-2xl border-2 border-dashed border-blue-500 dark:border-blue-400'>
                  <div className='flex flex-col items-center gap-4 z-100'>
                    <FontAwesomeIcon
                      icon={faUpload}
                      className='text-6xl text-blue-500 dark:text-blue-400 animate-bounce'
                    />
                    <p className='text-xl font-semibold text-gray-800 dark:text-gray-200'>Drop files here to upload</p>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>Release to start uploading</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Card className='border border-[#424242] mb-2'>
            <FileBreadcrumbs path={decodeURIComponent(browsingDirectory)} browsingBackup={browsingBackup} />
          </Card>
          <SelectionArea
            onSelectedStart={onSelectedStart}
            onSelected={onSelected}
            className='h-full'
            disabled={movingFiles.size > 0 || !!openModal || childOpenModal}
          >
            <ContextMenuProvider>
              <Table
                columns={['', 'Name', 'Size', 'Modified', '']}
                pagination={browsingEntries}
                onPageSelect={onPageSelect}
                allowSelect={false}
              >
                {browsingEntries.data.map((file) => (
                  <SelectionArea.Selectable key={file.name} item={file}>
                    {(innerRef: Ref<HTMLTableRowElement>) => (
                      <FileRow key={file.name} file={file} ref={innerRef} setChildOpenModal={setChildOpenModal} />
                    )}
                  </SelectionArea.Selectable>
                ))}
              </Table>
            </ContextMenuProvider>
          </SelectionArea>
        </>
      )}
    </div>
  );
}
