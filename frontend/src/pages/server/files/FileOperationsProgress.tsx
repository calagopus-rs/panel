import { Popover, Text, UnstyledButton } from '@mantine/core';
import { memo, useMemo } from 'react';
import CloseButton from '@/elements/CloseButton';
import Progress from '@/elements/Progress';
import RingProgress from '@/elements/RingProgress';

interface FileUploadInfo {
  fileName: string;
  progress: number;
  size: number;
  uploaded: number;
  status: 'pending' | 'uploading' | 'completed' | 'cancelled' | 'error';
}

interface FileOperation {
  type: 'compress' | 'decompress' | 'pull';
  path: string;
  progress: number;
  total: number;
}

interface FileOperationsProgressProps {
  uploadingFiles: Map<string, FileUploadInfo>;
  fileOperations: Map<string, FileOperation>;
  aggregatedUploadProgress: Map<
    string,
    {
      totalSize: number;
      uploadedSize: number;
      fileCount: number;
      completedCount: number;
      pendingCount: number;
    }
  >;
  onCancelFileUpload: (key: string) => void;
  onCancelFolderUpload: (folderName: string) => void;
  onCancelOperation: (uuid: string) => void;
}

const FileOperationsProgress = memo(function FileOperationsProgress({
  uploadingFiles,
  fileOperations,
  aggregatedUploadProgress,
  onCancelFileUpload,
  onCancelFolderUpload,
  onCancelOperation,
}: FileOperationsProgressProps) {
  const hasOperations = fileOperations.size > 0 || uploadingFiles.size > 0;

  const averageOperationProgress = useMemo(() => {
    if (fileOperations.size === 0 && uploadingFiles.size === 0) {
      return 0;
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

    return totalSize > 0 ? (totalProgress / totalSize) * 100 : 0;
  }, [fileOperations, uploadingFiles]);

  if (!hasOperations) return null;

  return (
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
              ? `Uploading folder: ${folderName} (${info.fileCount - info.pendingCount}/${info.fileCount} files)`
              : `Uploading folder: ${folderName} (${info.fileCount} files)`;

          return (
            <div key={folderName} className='flex flex-row items-center mb-3'>
              <div className='flex flex-col grow'>
                <p className='break-all mb-1'>{statusText}</p>
                <Progress value={progress} />
              </div>
              <CloseButton className='ml-3' onClick={() => onCancelFolderUpload(folderName)} />
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
              <CloseButton className='ml-3' onClick={() => onCancelFileUpload(key)} />
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
              <CloseButton className='ml-3' onClick={() => onCancelOperation(uuid)} />
            </div>
          );
        })}
      </Popover.Dropdown>
    </Popover>
  );
});

export default FileOperationsProgress;
