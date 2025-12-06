import { faAnglesDown, faAnglesUp, faArchive, faFileDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { join } from 'pathe';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { httpErrorToHuman } from '@/api/axios';
import downloadFiles from '@/api/server/files/downloadFiles';
import renameFiles from '@/api/server/files/renameFiles';
import Button from '@/elements/Button';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import ArchiveCreateModal from './modals/ArchiveCreateModal';
import FileDeleteModal from './modals/FileDeleteModal';
import ActionBar from '@/elements/ActionBar';

export default function FileActionBar() {
  const [searchParams, _] = useSearchParams();
  const { addToast } = useToast();
  const {
    server,
    browsingDirectory,
    browsingBackup,
    selectedFiles,
    setSelectedFiles,
    movingFiles,
    movingFilesDirectory,
    setMovingFiles,
    refreshFiles,
  } = useServerStore();

  const [openModal, setOpenModal] = useState<'archive' | 'delete' | null>(null);
  const [loading, setLoading] = useState(false);

  const doMove = () => {
    setLoading(true);

    renameFiles({
      uuid: server.uuid,
      root: '/',
      files: [...movingFiles].map((f) => ({
        from: join(movingFilesDirectory!, f.name),
        to: join(browsingDirectory!, f.name),
      })),
    })
      .then(({ renamed }) => {
        if (renamed < 1) {
          addToast('Files could not be moved.', 'error');
          return;
        }

        addToast(`${renamed} File${renamed === 1 ? ' has' : 's have'} been moved.`, 'success');
        setMovingFiles([]);
        refreshFiles(Number(searchParams.get('page')) || 1);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  const doDownload = () => {
    setLoading(true);

    downloadFiles(
      server.uuid,
      browsingDirectory!,
      Array.from(selectedFiles.values()).map((f) => f.name),
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if ((event.ctrlKey || event.metaKey) && event.key === 'x' && !movingFiles.size && !isInputFocused) {
        event.preventDefault();
        setSelectedFiles([]);
        setMovingFiles([...selectedFiles]);
      }

      if (event.key === 'Delete' && !movingFiles.size) {
        event.preventDefault();
        setOpenModal('delete');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movingFiles, selectedFiles]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'v' &&
        movingFiles.size > 0 &&
        !loading &&
        !isInputFocused
      ) {
        event.preventDefault();
        doMove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movingFiles, loading, selectedFiles]);

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
      <ActionBar opened={movingFiles.size > 0 || selectedFiles.size > 0}>
        {movingFiles.size > 0 ? (
          <>
            <Button onClick={doMove} loading={loading}>
              <FontAwesomeIcon icon={faAnglesDown} className='mr-2' /> Move {movingFiles.size} File
              {movingFiles.size === 1 ? '' : 's'} Here
            </Button>
            <Button variant='default' onClick={() => setMovingFiles([])}>
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
                    setMovingFiles([...selectedFiles]);
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
