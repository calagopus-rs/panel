import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faArchive, faFileDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import downloadFiles from '@/api/server/files/downloadFiles';
import ArchiveCreateModal from './modals/ArchiveCreateModal';
import FileDeleteModal from './modals/FileDeleteModal';
import Button from '@/elements/Button';

export default () => {
  const { addToast } = useToast();
  const { server, browsingDirectory, browsingBackup, selectedFiles } = useServerStore();

  const [openModal, setOpenModal] = useState<'archive' | 'delete'>(null);

  const doDownload = () => {
    downloadFiles(
      server.uuid,
      browsingDirectory,
      selectedFiles.map((f) => f.name),
      false,
    )
      .then(({ url }) => {
        addToast('Download started.', 'success');
        window.open(url);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return createPortal(
    <AnimatePresence>
      <ArchiveCreateModal
        key={'ArchiveCreateModal'}
        files={selectedFiles}
        opened={openModal === 'archive'}
        onClose={() => setOpenModal(null)}
      />
      <FileDeleteModal
        key={'FileDeleteModal'}
        files={selectedFiles}
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
      />
      {selectedFiles.length > 0 && (
        <motion.div
          className={'pointer-events-none fixed bottom-0 mb-6 flex justify-center w-full z-50'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className={'flex items-center space-x-4 pointer-events-auto rounded p-4 bg-black/50'}>
            <Button onClick={doDownload}>
              <FontAwesomeIcon icon={faFileDownload} className={'mr-2'} /> Download
            </Button>
            {!browsingBackup && (
              <>
                <Button onClick={() => setOpenModal('archive')}>
                  <FontAwesomeIcon icon={faArchive} className={'mr-2'} /> Archive
                </Button>
                <Button color={'red'} onClick={() => setOpenModal('delete')}>
                  <FontAwesomeIcon icon={faTrash} className={'mr-2'} />
                  Delete
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
