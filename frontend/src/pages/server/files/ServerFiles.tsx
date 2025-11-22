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
import { Ref, useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router';
import { axiosInstance, httpErrorToHuman } from '@/api/axios';
import getBackup from '@/api/server/backups/getBackup';
import cancelOperation from '@/api/server/files/cancelOperation';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
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

interface FileUploadProgress {
  fileName: string;
  progress: number;
  size: number;
  uploaded: number;
  batchId: string;
  status: 'pending' | 'uploading' | 'completed' | 'cancelled';
}

interface BatchInfo {
  controller: AbortController;
  fileIndices: number[];
  status: 'pending' | 'uploading' | 'completed' | 'cancelled';
}

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
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, FileUploadProgress>>(new Map());
  const [uploadBatches, setUploadBatches] = useState<Map<string, BatchInfo>>(new Map());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [activeBatchCount, setActiveBatchCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileIndexCounter = useRef(0);

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

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setPendingFiles((prev) => [...prev, ...files]);

      const startIndex = fileIndexCounter.current;
      fileIndexCounter.current += files.length;
      const initialProgress = new Map<string, FileUploadProgress>();

      files.forEach((file, index) => {
        const path = file.webkitRelativePath || file.name;
        const fileKey = `file-${startIndex + index}`;
        initialProgress.set(fileKey, {
          fileName: path,
          progress: 0,
          size: file.size,
          uploaded: 0,
          batchId: '',
          status: 'pending',
        });
      });
      setUploadingFiles((prev) => new Map([...prev, ...initialProgress]));

      try {
        const batches: { files: File[]; indices: number[] }[] = [];
        for (let i = 0; i < files.length; i += 2) {
          batches.push({
            files: files.slice(i, i + 2),
            indices: Array.from({ length: Math.min(2, files.length - i) }, (_, j) => startIndex + i + j),
          });
        }

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          while (activeBatchCount >= 4) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          const batch = batches[batchIndex];
          const batchId = `batch-${Date.now()}-${batchIndex}`;
          const controller = new AbortController();

          setUploadBatches(
            (prev) =>
              new Map([
                ...prev,
                [
                  batchId,
                  {
                    controller,
                    fileIndices: batch.indices,
                    status: 'pending',
                  },
                ],
              ]),
          );

          setUploadingFiles((prev) => {
            const updated = new Map(prev);
            batch.indices.forEach((idx) => {
              const key = `file-${idx}`;
              const file = updated.get(key);
              if (file) {
                updated.set(key, { ...file, batchId });
              }
            });
            return updated;
          });

          const batchInfo = uploadBatches.get(batchId);
          if (batchInfo?.status === 'cancelled') {
            continue;
          }

          setActiveBatchCount((prev) => prev + 1);

          setUploadBatches((prev) => {
            const updated = new Map(prev);
            const info = updated.get(batchId);
            if (info) {
              updated.set(batchId, { ...info, status: 'uploading' });
            }
            return updated;
          });

          setUploadingFiles((prev) => {
            const updated = new Map(prev);
            batch.indices.forEach((idx) => {
              const key = `file-${idx}`;
              const file = updated.get(key);
              if (file) {
                updated.set(key, { ...file, status: 'uploading' });
              }
            });
            return updated;
          });

          try {
            const { url } = await getFileUploadUrl(server.uuid, browsingDirectory);

            const formData = new FormData();
            batch.files.forEach((file) => {
              const path = file.webkitRelativePath || file.name;
              formData.append('files', file, path);
            });

            const batchTotalSize = batch.files.reduce((sum, file) => sum + file.size, 0);
            let lastLoaded = 0;

            await axiosInstance.post(url, formData, {
              signal: controller.signal,
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const currentLoaded = progressEvent.loaded;
                  const deltaLoaded = currentLoaded - lastLoaded;
                  lastLoaded = currentLoaded;

                  setUploadingFiles((prev) => {
                    const updated = new Map(prev);
                    batch.indices.forEach((index) => {
                      const fileKey = `file-${index}`;
                      const file = batch.files[index - batch.indices[0]];
                      if (updated.has(fileKey)) {
                        const fileProgress = updated.get(fileKey)!;
                        const fileRatio = file.size / batchTotalSize;

                        const newUploaded = Math.min(fileProgress.uploaded + deltaLoaded * fileRatio, file.size);
                        updated.set(fileKey, {
                          ...fileProgress,
                          progress: (newUploaded / file.size) * 100,
                          uploaded: newUploaded,
                        });
                      }
                    });
                    return updated;
                  });
                }
              },
            });

            setUploadingFiles((prev) => {
              const updated = new Map(prev);
              batch.indices.forEach((index) => {
                const fileKey = `file-${index}`;
                if (updated.has(fileKey)) {
                  const fileProgress = updated.get(fileKey)!;
                  updated.set(fileKey, {
                    ...fileProgress,
                    progress: 100,
                    uploaded: fileProgress.size,
                    status: 'completed',
                  });
                }
              });
              return updated;
            });

            setUploadBatches((prev) => {
              const updated = new Map(prev);
              const info = updated.get(batchId);
              if (info) {
                updated.set(batchId, { ...info, status: 'completed' });
              }
              return updated;
            });
          } catch (error) {
            if (error.name !== 'CanceledError') {
              throw error;
            }
          } finally {
            setActiveBatchCount((prev) => prev - 1);
          }
        }

        addToast(`Successfully uploaded ${files.length} file(s)`, 'success');
        loadDirectoryData();
      } catch (error) {
        if (error.name !== 'CanceledError') {
          addToast(`Failed to upload files: ${error.message || error}`, 'error');
        }
      } finally {
        setTimeout(() => {
          setUploadingFiles((prev) => {
            const updated = new Map();
            prev.forEach((file, key) => {
              if (file.status !== 'completed' && file.status !== 'cancelled') {
                updated.set(key, file);
              }
            });
            return updated;
          });
        }, 1000);

        setUploadBatches(new Map());

        if (uploadingFiles.size === 0) {
          setPendingFiles([]);
        }
      }
    },
    [server.uuid, browsingDirectory, activeBatchCount],
  );

  const cancelFileUpload = useCallback(
    async (fileKey: string) => {
      const file = uploadingFiles.get(fileKey);
      if (!file) return;

      const batch = uploadBatches.get(file.batchId);
      if (!batch) return;

      if (batch.status === 'pending') {
        setUploadingFiles((prev) => {
          const updated = new Map(prev);
          updated.delete(fileKey);
          return updated;
        });

        const fileIndex = parseInt(fileKey.split('-')[1]);
        setPendingFiles((prev) => prev.filter((_, idx) => idx !== fileIndex));
        return;
      }

      if (batch.status === 'uploading') {
        batch.controller.abort();

        setUploadBatches((prev) => {
          const updated = new Map(prev);
          updated.set(file.batchId, { ...batch, status: 'cancelled' });
          return updated;
        });

        const filesToReupload: File[] = [];
        batch.fileIndices.forEach((idx) => {
          const key = `file-${idx}`;
          if (key !== fileKey) {
            const fileData = uploadingFiles.get(key);
            if (fileData && fileData.status !== 'completed') {
              setUploadingFiles((prev) => {
                const updated = new Map(prev);
                updated.delete(key);
                return updated;
              });
              filesToReupload.push(pendingFiles[idx]);
            }
          }
        });

        setUploadingFiles((prev) => {
          const updated = new Map(prev);
          updated.delete(fileKey);
          return updated;
        });

        if (filesToReupload.length > 0) {
          await uploadFiles(filesToReupload);
        }
      }
    },
    [uploadingFiles, uploadBatches, pendingFiles, uploadFiles],
  );

  const cancelFolderUpload = useCallback(
    (folderName: string) => {
      const filesToCancel: string[] = [];
      const batchesToCancel = new Set<string>();

      uploadingFiles.forEach((file, key) => {
        if (file.fileName.startsWith(folderName + '/')) {
          filesToCancel.push(key);
          if (file.batchId) {
            batchesToCancel.add(file.batchId);
          }
        }
      });

      batchesToCancel.forEach((batchId) => {
        const batch = uploadBatches.get(batchId);
        if (batch && batch.status === 'uploading') {
          batch.controller.abort();
        }
      });

      setUploadingFiles((prev) => {
        const updated = new Map(prev);
        filesToCancel.forEach((key) => updated.delete(key));
        return updated;
      });

      setUploadBatches((prev) => {
        const updated = new Map(prev);
        batchesToCancel.forEach((batchId) => updated.delete(batchId));
        return updated;
      });

      addToast(`Cancelled upload of folder: ${folderName}`, 'info');
    },
    [uploadingFiles, uploadBatches],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      uploadFiles(acceptedFiles);
    },
    [uploadFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    uploadFiles(files);
    event.target.value = '';
  };

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    uploadFiles(files);
    event.target.value = '';
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
      if ((event.ctrlKey || event.metaKey) && event.key === 'Escape') {
        event.preventDefault();
        setSelectedFiles([]);
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        setSelectedFiles(browsingEntries.data);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [browsingEntries.data]);

  const getAggregatedUploadProgress = useCallback(() => {
    const folderMap = new Map<
      string,
      {
        totalSize: number;
        uploadedSize: number;
        fileCount: number;
        completedCount: number;
        pendingCount: number;
      }
    >();

    uploadingFiles.forEach((file) => {
      const pathParts = file.fileName.split('/');
      if (pathParts.length > 1) {
        const folderName = pathParts[0];
        const existing = folderMap.get(folderName) || {
          totalSize: 0,
          uploadedSize: 0,
          fileCount: 0,
          completedCount: 0,
          pendingCount: 0,
        };

        folderMap.set(folderName, {
          totalSize: existing.totalSize + file.size,
          uploadedSize: existing.uploadedSize + file.uploaded,
          fileCount: existing.fileCount + 1,
          completedCount: existing.completedCount + (file.status === 'completed' ? 1 : 0),
          pendingCount: existing.pendingCount + (file.status === 'pending' ? 1 : 0),
        });
      }
    });

    return folderMap;
  }, [uploadingFiles]);

  const folderProgress = getAggregatedUploadProgress();
  const hasOperations = fileOperations.size > 0 || uploadingFiles.size > 0;

  return (
    <div {...getRootProps()} className='h-fit relative'>
      <input {...getInputProps()} />

      <input ref={fileInputRef} type='file' multiple style={{ display: 'none' }} onChange={handleFileSelect} />
      <input
        ref={folderInputRef}
        type='file'
        multiple
        style={{ display: 'none' }}
        onChange={handleFolderSelect}
        {...{ webkitdirectory: '', directory: '' }}
      />

      {isDragActive && (
        <div className='fixed inset-0 z-50 bg-blue-500 bg-opacity-20 flex items-center justify-center pointer-events-none'>
          <div className='bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl'>
            <FontAwesomeIcon icon={faUpload} className='text-4xl text-blue-500 mb-4' />
            <p className='text-lg font-semibold'>Drop files here to upload</p>
          </div>
        </div>
      )}

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
                  {Array.from(folderProgress).map(([folderName, info]) => {
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
                    if (folderProgress.size > 0 && file.fileName.includes('/')) {
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
          <Card className='border border-b-0 border-[#424242] rounded-b-none!'>
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
