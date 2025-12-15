import { faAnglesDown, faAnglesUp, faArchive, faFileDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { join } from 'pathe';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { httpErrorToHuman } from '@/api/axios.ts';
import downloadFiles from '@/api/server/files/downloadFiles.ts';
import renameFiles from '@/api/server/files/renameFiles.ts';
import ActionBar from '@/elements/ActionBar.tsx';
import Button from '@/elements/Button.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import { useFileKeyboardActions } from './hooks/useFileKeyboardActions.ts';
import ArchiveCreateModal from './modals/ArchiveCreateModal.tsx';
import FileDeleteModal from './modals/FileDeleteModal.tsx';

export default function FileActionBar() {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const {
    server,
    browsingDirectory,
    browsingBackup,
    selectedFileNames,
    setSelectedFiles,
    movingFileNames,
    movingFilesDirectory,
    setMovingFiles,
    clearMovingFiles,
    getSelectedFiles,
    refreshFiles,
  } = useServerStore();

  const [openModal, setOpenModal] = useState<'archive' | 'delete' | null>(null);
  const [loading, setLoading] = useState(false);

  const doMove = () => {
    setLoading(true);

    renameFiles({
      uuid: server.uuid,
      root: '/',
      files: [...movingFileNames].map((f) => ({
        from: join(movingFilesDirectory!, f),
        to: join(browsingDirectory!, f),
      })),
    })
      .then(({ renamed }) => {
        if (renamed < 1) {
          addToast('Files could not be moved.', 'error');
          return;
        }

        addToast(`${renamed} File${renamed === 1 ? ' has' : 's have'} been moved.`, 'success');
        clearMovingFiles();
        refreshFiles(Number(searchParams.get('page')) || 1);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  const doDownload = () => {
    setLoading(true);

    const selectedFiles = getSelectedFiles();
    downloadFiles(
      server.uuid,
      browsingDirectory!,
      selectedFiles.map((f) => f.name),
      false,
      'zip',
    )
      .then(({ url }) => {
        addToast('Download started.', 'success');
        window.open(url);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  useFileKeyboardActions({
    onDelete: () => setOpenModal('delete'),
    onPaste: () => doMove(),
    browsingBackup: !!browsingBackup,
  });

  const selectedFiles = getSelectedFiles();

  return (
    <>
      <ArchiveCreateModal
        key='ArchiveCreateModal'
        files={[...selectedFiles]}
        opened={openModal === 'archive'}
        onClose={() => setOpenModal(null)}
      />
      <FileDeleteModal
        key='FileDeleteModal'
        files={[...selectedFiles]}
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
      />
      <ActionBar opened={movingFileNames.size > 0 || selectedFileNames.size > 0}>
        {movingFileNames.size > 0 ? (
          <>
            <Button onClick={doMove} loading={loading}>
              <FontAwesomeIcon icon={faAnglesDown} className='mr-2' /> Move {movingFileNames.size} File
              {movingFileNames.size === 1 ? '' : 's'} Here
            </Button>
            <Button variant='default' onClick={clearMovingFiles}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button onClick={doDownload} loading={loading}>
              <FontAwesomeIcon icon={faFileDownload} className='mr-2' /> Download
            </Button>
            {!browsingBackup && (
              <>
                <Button onClick={() => setOpenModal('archive')}>
                  <FontAwesomeIcon icon={faArchive} className='mr-2' /> Archive
                </Button>
                <Button
                  onClick={() => {
                    setMovingFiles(selectedFiles);
                    setSelectedFiles([]);
                  }}
                >
                  <FontAwesomeIcon icon={faAnglesUp} className='mr-2' /> Move
                </Button>
                <Button color='red' onClick={() => setOpenModal('delete')}>
                  <FontAwesomeIcon icon={faTrash} className='mr-2' />
                  Delete
                </Button>
              </>
            )}
          </>
        )}
      </ActionBar>
    </>
  );
}
