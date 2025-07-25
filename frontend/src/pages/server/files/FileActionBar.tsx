import { Button } from '@/elements/button';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faArchive, faFileDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import FileDeleteDialog from './dialogs/FileDeleteDialog';
import { useState } from 'react';
import deleteFiles from '@/api/server/files/deleteFiles';
import { httpErrorToHuman } from '@/api/axios';
import compressFiles from '@/api/server/files/compressFiles';
import downloadFiles from '@/api/server/files/downloadFiles';
import ArchiveCreateDialog from './dialogs/ArchiveCreateDialog';

export default () => {
  const { addToast } = useToast();
  const {
    server,
    browsingDirectory,
    browsingBackup,
    browsingEntries,
    setBrowsingEntries,
    addBrowsingEntry,
    selectedFiles,
    setSelectedFiles,
  } = useServerStore();

  const [openDialog, setOpenDialog] = useState<'archive' | 'delete'>(null);

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

  const doArchive = (name: string, format: ArchiveFormat) => {
    compressFiles(server.uuid, {
      name,
      format,
      root: browsingDirectory,
      files: selectedFiles.map((f) => f.name),
    })
      .then((entry) => {
        addToast('Files have been archived.', 'success');
        setOpenDialog(null);
        setSelectedFiles([]);
        addBrowsingEntry(entry);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doDelete = () => {
    deleteFiles(
      server.uuid,
      browsingDirectory,
      selectedFiles.map((f) => f.name),
    )
      .then(() => {
        addToast('Files have been deleted.', 'success');
        setOpenDialog(null);
        setSelectedFiles([]);
        setBrowsingEntries({
          ...browsingEntries,
          data: browsingEntries.data.filter((f) => !selectedFiles.find((s) => s.name === f.name)),
        });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return createPortal(
    <AnimatePresence>
      <ArchiveCreateDialog
        key={'ArchiveCreateDialog'}
        open={openDialog === 'archive'}
        onClose={() => setOpenDialog(null)}
        onCreate={doArchive}
      />
      <FileDeleteDialog
        key={'FileDeleteDialog'}
        files={selectedFiles}
        onDelete={doDelete}
        open={openDialog === 'delete'}
        onClose={() => setOpenDialog(null)}
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
                <Button onClick={() => setOpenDialog('archive')}>
                  <FontAwesomeIcon icon={faArchive} className={'mr-2'} /> Archive
                </Button>
                <Button style={Button.Styles.Red} onClick={() => setOpenDialog('delete')}>
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
