import { Group, Title } from '@mantine/core';
import { type Ref, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { httpErrorToHuman } from '@/api/axios.ts';
import getBackup from '@/api/server/backups/getBackup.ts';
import cancelOperation from '@/api/server/files/cancelOperation.ts';
import loadDirectory from '@/api/server/files/loadDirectory.ts';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import SelectionArea from '@/elements/SelectionArea.tsx';
import Spinner from '@/elements/Spinner.tsx';
import Table from '@/elements/Table.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import { useFileUpload } from '@/plugins/useFileUpload.ts';
import FileActionBar from './FileActionBar.tsx';
import FileBreadcrumbs from './FileBreadcrumbs.tsx';
import FileRow from './FileRow.tsx';
import FileToolbar from './FileToolbar.tsx';
import FileUploadOverlay from './FileUploadOverlay.tsx';
import FileOperationsProgress from './FileOperationsProgress.tsx';
import DirectoryNameModal from './modals/DirectoryNameModal.tsx';
import PullFileModal from './modals/PullFileModal.tsx';
import SftpDetailsModal from './modals/SftpDetailsModal.tsx';
import { useFileDragAndDrop } from './hooks/useFileDragAndDrop.ts';

export default function ServerFiles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const {
    server,
    browsingDirectory,
    setBrowsingDirectory,
    browsingBackup,
    setBrowsingBackup,
    browsingEntries,
    setBrowsingEntries,
    selectedFileNames,
    setSelectedFiles,
    movingFileNames,
    fileOperations,
    removeFileOperation,
  } = useServerStore();

  const [openModal, setOpenModal] = useState<'sftpDetails' | 'nameDirectory' | 'pullFile' | null>(null);
  const [childOpenModal, setChildOpenModal] = useState(false);
  const [loading, setLoading] = useState(browsingEntries.data.length === 0);
  const [page, setPage] = useState(1);
  const [selectedFilesPrevious, setSelectedFilesPrevious] = useState<Set<string>>(new Set());
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
  } = useFileUpload(server.uuid, browsingDirectory!, () => loadDirectoryData());

  const { isDragging } = useFileDragAndDrop({
    onDrop: uploadFiles,
    enabled: !browsingBackup,
  });

  useEffect(() => {
    setBrowsingDirectory(searchParams.get('directory') || '/');
    setPage(Number(searchParams.get('page')) || 1);
  }, [searchParams, setBrowsingDirectory]);

  const onPageSelect = (page: number) => {
    setSearchParams({ directory: browsingDirectory!, page: page.toString() });
  };

  const loadDirectoryData = () => {
    setLoading(true);

    loadDirectory(server.uuid, browsingDirectory!, page)
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

  const onSelectedStart = (event: ReactMouseEvent | MouseEvent) => {
    setSelectedFilesPrevious(event.shiftKey ? selectedFileNames : new Set<string>());
  };

  const onSelected = (selected: DirectoryEntry[]) => {
    const previousFiles = browsingEntries.data.filter((entry) => selectedFilesPrevious.has(entry.name));
    setSelectedFiles([...previousFiles, ...selected]);
  };

  useEffect(() => {
    if (!browsingDirectory) return;

    loadDirectoryData();
  }, [browsingDirectory, page]);

  useEffect(() => {
    setSelectedFiles([]);
  }, [browsingDirectory]);

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

      <Group justify='space-between' align='center' mb='md'>
        <Title order={1} c='white'>
          Files
        </Title>
        {!browsingBackup && (
          <Group>
            <FileOperationsProgress
              uploadingFiles={uploadingFiles}
              fileOperations={fileOperations}
              aggregatedUploadProgress={aggregatedUploadProgress}
              onCancelFileUpload={cancelFileUpload}
              onCancelFolderUpload={cancelFolderUpload}
              onCancelOperation={doCancelOperation}
            />
            <FileToolbar
              serverUuidShort={server.uuidShort}
              browsingDirectory={browsingDirectory}
              onSftpDetailsClick={() => setOpenModal('sftpDetails')}
              onNewDirectoryClick={() => setOpenModal('nameDirectory')}
              onPullFileClick={() => setOpenModal('pullFile')}
              onFileUploadClick={() => fileInputRef.current?.click()}
              onFolderUploadClick={() => folderInputRef.current?.click()}
            />
          </Group>
        )}
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <>
          <FileUploadOverlay visible={isDragging && !browsingBackup} />

          <div className='bg-[#282828] border border-[#424242] rounded-lg mb-2 p-4'>
            <FileBreadcrumbs path={decodeURIComponent(browsingDirectory)} browsingBackup={browsingBackup} />
          </div>
          <SelectionArea
            onSelectedStart={onSelectedStart}
            onSelected={onSelected}
            className='h-full'
            disabled={movingFileNames.size > 0 || !!openModal || childOpenModal}
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
                    {(innerRef: Ref<HTMLElement>) => (
                      <FileRow
                        key={file.name}
                        file={file}
                        ref={innerRef as Ref<HTMLTableRowElement>}
                        setChildOpenModal={setChildOpenModal}
                      />
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
