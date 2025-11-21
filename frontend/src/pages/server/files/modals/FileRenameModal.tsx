import { Group, ModalProps } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import renameFiles from '@/api/server/files/renameFiles';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

type Props = ModalProps & {
  file: DirectoryEntry;
};

export default function FileRenameModal({ file, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { server, browsingDirectory, browsingEntries, setBrowsingEntries } = useServerStore();

  const [newFileName, setNewFileName] = useState(file.name);
  const [loading, setLoading] = useState(false);

  const doRename = () => {
    setLoading(true);

    renameFiles({
      uuid: server.uuid,
      root: browsingDirectory,
      files: [
        {
          from: file.name,
          to: newFileName,
        },
      ],
    })
      .then(({ renamed }) => {
        if (renamed < 1) {
          addToast('File could not be renamed.', 'error');
          return;
        }

        addToast('File has been renamed.', 'success');
        setBrowsingEntries({
          ...browsingEntries,
          data: browsingEntries.data.map((entry) =>
            entry.name === file.name ? { ...entry, name: newFileName } : entry,
          ),
        });
        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Rename File' onClose={onClose} opened={opened}>
      <TextInput
        withAsterisk
        label='File Name'
        placeholder='File Name'
        value={newFileName}
        onChange={(e) => setNewFileName(e.target.value)}
      />

      <Group mt='md'>
        <Button onClick={doRename} loading={loading}>
          Rename
        </Button>
        <Button variant='default' onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
}
