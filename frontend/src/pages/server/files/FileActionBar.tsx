import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faAnglesDown, faAnglesUp, faArchive, faFileDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import downloadFiles from '@/api/server/files/downloadFiles';
import ArchiveCreateModal from './modals/ArchiveCreateModal';
import FileDeleteModal from './modals/FileDeleteModal';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import renameFiles from '@/api/server/files/renameFiles';
import { join } from 'pathe';
import { useSearchParams } from 'react-router';

export default () => {
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

  const [openModal, setOpenModal] = useState<'archive' | 'delete'>(null);
  const [loading, setLoading] = useState(false);

  const doMove = () => {
    load(true, setLoading);

    renameFiles({
      uuid: server.uuid,
      root: '/',
      files: [...movingFiles].map((f) => ({
        from: join(movingFilesDirectory, f.name),
        to: join(browsingDirectory, f.name),
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
      .finally(() => load(false, setLoading));
  };

  const doDownload = () => {
    load(true, setLoading);

    downloadFiles(
      server.uuid,
      browsingDirectory,
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
      .finally(() => load(false, setLoading));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'x' && !movingFiles.size) {
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
      if ((event.ctrlKey || event.metaKey) && event.key === 'v' && movingFiles.size > 0 && !loading) {
        event.preventDefault();
        doMove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movingFiles, loading, selectedFiles]);

  return createPortal(
    <AnimatePresence>
      <ArchiveCreateModal
        key={'ArchiveCreateModal'}
        files={[...selectedFiles]}
        opened={openModal === 'archive'}
        onClose={() => setOpenModal(null)}
      />
      <FileDeleteModal
        key={'FileDeleteModal'}
        files={[...selectedFiles]}
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
      />
      {(selectedFiles.size > 0 || movingFiles.size > 0) && (
        <motion.div
          className={'pointer-events-none fixed bottom-0 mb-6 flex justify-center w-full z-50'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className={'flex items-center space-x-4 pointer-events-auto rounded p-4 bg-black/50'}>
            {movingFiles.size > 0 ? (
              <>
                <Button onClick={doMove} loading={loading}>
                  <FontAwesomeIcon icon={faAnglesDown} className={'mr-2'} /> Move {movingFiles.size} File
                  {movingFiles.size === 1 ? '' : 's'} Here
                </Button>
                <Button variant={'default'} onClick={() => setMovingFiles([])}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={doDownload} loading={loading}>
                  <FontAwesomeIcon icon={faFileDownload} className={'mr-2'} /> Download
                </Button>
                {!browsingBackup && (
                  <>
                    <Button onClick={() => setOpenModal('archive')}>
                      <FontAwesomeIcon icon={faArchive} className={'mr-2'} /> Archive
                    </Button>
                    <Button
                      onClick={() => {
                        setMovingFiles([...selectedFiles]);
                        setSelectedFiles([]);
                      }}
                    >
                      <FontAwesomeIcon icon={faAnglesUp} className={'mr-2'} /> Move
                    </Button>
                    <Button color={'red'} onClick={() => setOpenModal('delete')}>
                      <FontAwesomeIcon icon={faTrash} className={'mr-2'} />
                      Delete
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
