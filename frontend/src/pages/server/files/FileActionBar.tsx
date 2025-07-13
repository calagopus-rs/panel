import { Button } from '@/elements/button';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faArchive, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import FileDeleteDialog from './dialogs/FileDeleteDialog';
import { useState } from 'react';
import deleteFiles from '@/api/server/files/deleteFiles';
import { httpErrorToHuman } from '@/api/axios';
import compressFiles from '@/api/server/files/compressFiles';

export default () => {
  const { addToast } = useToast();
  const {
    server,
    browsingDirectory,
    browsingEntries,
    setBrowsingEntries,
    addBrowsingEntry,
    selectedFiles,
    setSelectedFiles,
  } = useServerStore();

  const [openDialog, setOpenDialog] = useState<'delete'>(null);

  const doArchive = () => {
    compressFiles(
      server.uuid,
      browsingDirectory,
      selectedFiles.map(f => f.name),
    )
      .then(entry => {
        addToast(`Files have been archived.`, 'success');
        setSelectedFiles([]);
        addBrowsingEntry(entry);
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doDelete = () => {
    deleteFiles(
      server.uuid,
      browsingDirectory,
      selectedFiles.map(f => f.name),
    )
      .then(() => {
        addToast(`Files have been deleted.`, 'success');
        setOpenDialog(null);
        setSelectedFiles([]);
        setBrowsingEntries({
          ...browsingEntries,
          data: browsingEntries.data.filter(f => !selectedFiles.find(s => s.name === f.name)),
        });
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return createPortal(
    <AnimatePresence>
      <FileDeleteDialog
        files={selectedFiles}
        onDelete={doDelete}
        open={openDialog === 'delete'}
        onClose={() => setOpenDialog(null)}
      />
      {selectedFiles.length > 0 && (
        <motion.div
          className="pointer-events-none fixed bottom-0 mb-6 flex justify-center w-full z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="flex items-center space-x-4 pointer-events-auto rounded p-4 bg-black/50">
            <Button onClick={doArchive}>
              <FontAwesomeIcon icon={faArchive} className="mr-2" /> Archive
            </Button>
            <Button style={Button.Styles.Red} onClick={() => setOpenDialog('delete')}>
              <FontAwesomeIcon icon={faTrash} className="mr-2" />
              Delete
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
