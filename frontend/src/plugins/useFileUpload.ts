import { ChangeEvent, RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { axiosInstance } from '@/api/axios';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import { useToast } from '@/providers/ToastProvider';

interface FileUploadProgress {
  fileName: string;
  progress: number;
  size: number;
  uploaded: number;
  batchId: string;
  status: 'pending' | 'uploading' | 'completed' | 'cancelled' | 'error';
}

interface BatchInfo {
  controller: AbortController;
  fileIndices: number[];
  status: 'pending' | 'uploading' | 'completed' | 'cancelled' | 'error';
  files: File[];
}

const MAX_CONCURRENT_BATCHES = 4;
const BATCH_SIZE = 2;
const CLEANUP_DELAY = 2000;

export function useFileUpload(serverUuid: string, directory: string, onUploadComplete: () => void) {
  const { addToast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, FileUploadProgress>>(new Map());
  const [uploadBatches, setUploadBatches] = useState<Map<string, BatchInfo>>(new Map());

  const fileIndexCounter = useRef(0);
  const activeBatchCount = useRef(0);
  const uploadQueue = useRef<Array<{ files: File[]; indices: number[]; batchId: string }>>([]);
  const isProcessingQueue = useRef(false);
  const cleanupTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const batchControllers = useRef<Map<string, AbortController>>(new Map());

  const clearCleanupTimeout = useCallback((key: string) => {
    const timeout = cleanupTimeouts.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
      cleanupTimeouts.current.delete(key);
    }
  }, []);

  const processBatch = useCallback(
    async (batchId: string, batch: { files: File[]; indices: number[]; batchId: string }) => {
      const controller = batchControllers.current.get(batchId);
      if (!controller) {
        return;
      }

      activeBatchCount.current++;

      try {
        setUploadBatches((prev) => {
          const updated = new Map(prev);
          const info = updated.get(batchId);
          if (info && info.status === 'pending') {
            updated.set(batchId, { ...info, status: 'uploading' });
          }
          return updated;
        });

        setUploadingFiles((prev) => {
          const updated = new Map(prev);
          batch.indices.forEach((idx) => {
            const key = `file-${idx}`;
            const file = updated.get(key);
            if (file && file.status === 'pending') {
              updated.set(key, { ...file, status: 'uploading' });
            }
          });
          return updated;
        });

        const { url } = await getFileUploadUrl(serverUuid, directory);

        const formData = new FormData();
        batch.files.forEach((file) => {
          const path = file.webkitRelativePath || file.name;
          formData.append('files', file, path);
        });

        const batchTotalSize = batch.files.reduce((sum, file) => sum + file.size, 0);
        let lastTotalLoaded = 0;

        await axiosInstance.post(url, formData, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const currentTotalLoaded = progressEvent.loaded || 0;
            const deltaLoaded = currentTotalLoaded - lastTotalLoaded;
            lastTotalLoaded = currentTotalLoaded;

            if (deltaLoaded <= 0) return;

            setUploadingFiles((prev) => {
              const updated = new Map(prev);
              batch.indices.forEach((index, i) => {
                const fileKey = `file-${index}`;
                const file = batch.files[i];
                const fileProgress = updated.get(fileKey);

                if (fileProgress && fileProgress.status === 'uploading') {
                  const fileRatio = file.size / batchTotalSize;
                  const fileDelta = deltaLoaded * fileRatio;
                  const newUploaded = Math.min(fileProgress.uploaded + fileDelta, file.size);

                  updated.set(fileKey, {
                    ...fileProgress,
                    uploaded: newUploaded,
                    progress: (newUploaded / file.size) * 100,
                  });
                }
              });
              return updated;
            });
          },
        });

        setUploadingFiles((prev) => {
          const updated = new Map(prev);
          batch.indices.forEach((index) => {
            const fileKey = `file-${index}`;
            const fileProgress = updated.get(fileKey);
            if (fileProgress && fileProgress.status === 'uploading') {
              updated.set(fileKey, {
                ...fileProgress,
                progress: 100,
                uploaded: fileProgress.size,
                status: 'completed',
              });

              const timeout = setTimeout(() => {
                setUploadingFiles((prev) => {
                  const updated = new Map(prev);
                  updated.delete(fileKey);
                  return updated;
                });
                cleanupTimeouts.current.delete(fileKey);
              }, CLEANUP_DELAY);

              cleanupTimeouts.current.set(fileKey, timeout);
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
      } catch (error: any) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          setUploadingFiles((prev) => {
            const updated = new Map(prev);
            batch.indices.forEach((index) => {
              const fileKey = `file-${index}`;
              const fileProgress = updated.get(fileKey);
              if (fileProgress && fileProgress.status !== 'completed') {
                updated.set(fileKey, { ...fileProgress, status: 'cancelled' });

                const timeout = setTimeout(() => {
                  setUploadingFiles((prev) => {
                    const updated = new Map(prev);
                    updated.delete(fileKey);
                    return updated;
                  });
                  cleanupTimeouts.current.delete(fileKey);
                }, CLEANUP_DELAY);

                cleanupTimeouts.current.set(fileKey, timeout);
              }
            });
            return updated;
          });

          setUploadBatches((prev) => {
            const updated = new Map(prev);
            const info = updated.get(batchId);
            if (info) {
              updated.set(batchId, { ...info, status: 'cancelled' });
            }
            return updated;
          });
        } else {
          console.error('Upload error:', error);

          setUploadingFiles((prev) => {
            const updated = new Map(prev);
            batch.indices.forEach((index) => {
              const fileKey = `file-${index}`;
              const fileProgress = updated.get(fileKey);
              if (fileProgress && fileProgress.status !== 'completed') {
                updated.set(fileKey, { ...fileProgress, status: 'error' });
              }
            });
            return updated;
          });

          setUploadBatches((prev) => {
            const updated = new Map(prev);
            const info = updated.get(batchId);
            if (info) {
              updated.set(batchId, { ...info, status: 'error' });
            }
            return updated;
          });

          addToast(`Failed to upload batch: ${error.message || 'Unknown error'}`, 'error');
        }
      } finally {
        activeBatchCount.current--;
        batchControllers.current.delete(batchId);

        setTimeout(() => {
          setUploadBatches((prev) => {
            const updated = new Map(prev);
            updated.delete(batchId);
            return updated;
          });
        }, CLEANUP_DELAY);

        if (uploadQueue.current.length === 0 && activeBatchCount.current === 0) {
          setTimeout(() => {
            setUploadingFiles((prev) => {
              const hasActiveUploads = Array.from(prev.values()).some(
                (f) => f.status === 'uploading' || f.status === 'pending',
              );
              if (!hasActiveUploads) {
                onUploadComplete();
              }
              return prev;
            });
          }, 100);
        }
      }
    },
    [serverUuid, directory, onUploadComplete, addToast],
  );

  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current) {
      return;
    }

    isProcessingQueue.current = true;

    while (uploadQueue.current.length > 0) {
      while (activeBatchCount.current >= MAX_CONCURRENT_BATCHES) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const batch = uploadQueue.current.shift();
      if (!batch) break;

      const controller = batchControllers.current.get(batch.batchId);
      if (!controller || controller.signal.aborted) {
        continue;
      }

      processBatch(batch.batchId, batch).catch(console.error);
    }

    isProcessingQueue.current = false;
  }, [processBatch]);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const startIndex = fileIndexCounter.current;
      fileIndexCounter.current += files.length;

      const batches: Array<{ files: File[]; indices: number[]; batchId: string }> = [];
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batchFiles = files.slice(i, i + BATCH_SIZE);
        const indices = Array.from({ length: batchFiles.length }, (_, j) => startIndex + i + j);
        const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`;
        const controller = new AbortController();

        batchControllers.current.set(batchId, controller);

        batches.push({ files: batchFiles, indices, batchId });
      }

      setUploadBatches((prev) => {
        const updated = new Map(prev);
        batches.forEach((batch) => {
          const controller = batchControllers.current.get(batch.batchId);
          if (controller) {
            updated.set(batch.batchId, {
              controller,
              fileIndices: batch.indices,
              status: 'pending',
              files: batch.files,
            });
          }
        });
        return updated;
      });

      setUploadingFiles((prev) => {
        const updated = new Map(prev);
        batches.forEach((batch) => {
          batch.files.forEach((file, index) => {
            // Use file.name which contains the full path for drag-dropped folders
            const path = file.name;
            const fileKey = `file-${batch.indices[index]}`;
            updated.set(fileKey, {
              fileName: path,
              progress: 0,
              size: file.size,
              uploaded: 0,
              batchId: batch.batchId,
              status: 'pending',
            });
          });
        });
        return updated;
      });

      uploadQueue.current.push(...batches);

      processQueue();

      addToast(`Started uploading ${files.length} file(s)`, 'info');
    },
    [processQueue, addToast],
  );

  const cancelFileUpload = useCallback(
    (fileKey: string) => {
      const file = uploadingFiles.get(fileKey);
      if (!file) return;

      const batchId = file.batchId;
      if (!batchId) {
        setUploadingFiles((prev) => {
          const updated = new Map(prev);
          updated.delete(fileKey);
          return updated;
        });
        clearCleanupTimeout(fileKey);
        return;
      }

      const controller = batchControllers.current.get(batchId);
      if (controller) {
        controller.abort();
      }

      uploadQueue.current = uploadQueue.current.filter((b) => b.batchId !== batchId);

      setUploadBatches((prev) => {
        const updated = new Map(prev);
        const info = updated.get(batchId);
        if (info) {
          updated.set(batchId, { ...info, status: 'cancelled' });
        }
        return updated;
      });

      const batch = uploadBatches.get(batchId);
      if (batch) {
        setUploadingFiles((prev) => {
          const updated = new Map(prev);
          batch.fileIndices.forEach((idx) => {
            const key = `file-${idx}`;
            updated.delete(key);
            clearCleanupTimeout(key);
          });
          return updated;
        });
      }
    },
    [uploadingFiles, uploadBatches, clearCleanupTimeout],
  );

  const cancelFolderUpload = useCallback(
    (folderName: string) => {
      const batchesToCancel = new Set<string>();
      const filesToCancel: string[] = [];

      uploadingFiles.forEach((file, key) => {
        const isInFolder =
          file.fileName.startsWith(folderName + '/') ||
          file.fileName === folderName ||
          file.fileName.split('/')[0] === folderName;

        if (isInFolder) {
          filesToCancel.push(key);
          if (file.batchId) {
            batchesToCancel.add(file.batchId);
          }
        }
      });

      if (filesToCancel.length === 0) {
        return;
      }

      batchesToCancel.forEach((batchId) => {
        const controller = batchControllers.current.get(batchId);
        if (controller) {
          controller.abort();
        }
      });

      uploadQueue.current = uploadQueue.current.filter((b) => !batchesToCancel.has(b.batchId));

      setUploadBatches((prev) => {
        const updated = new Map(prev);
        batchesToCancel.forEach((batchId) => {
          updated.delete(batchId);
          batchControllers.current.delete(batchId);
        });
        return updated;
      });

      setUploadingFiles((prev) => {
        const updated = new Map(prev);
        filesToCancel.forEach((key) => {
          updated.delete(key);
          clearCleanupTimeout(key);
        });
        return updated;
      });

      addToast(`Cancelled ${filesToCancel.length} file(s) from folder: ${folderName}`, 'info');
    },
    [uploadingFiles, addToast, clearCleanupTimeout],
  );

  const aggregatedUploadProgress = useMemo(() => {
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

  const handleFileSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>, inputRef: RefObject<HTMLInputElement | null>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        uploadFiles(files);
      }
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [uploadFiles],
  );

  const handleFolderSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>, inputRef: RefObject<HTMLInputElement | null>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        uploadFiles(files);
      }
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [uploadFiles],
  );

  return {
    uploadingFiles,
    uploadFiles,
    cancelFileUpload,
    cancelFolderUpload,
    aggregatedUploadProgress,
    handleFileSelect,
    handleFolderSelect,
  };
}
