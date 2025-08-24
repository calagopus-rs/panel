import { httpErrorToHuman } from '@/api/axios';
import createBackup from '@/api/server/backups/createBackup';
import Button from '@/elements/Button';
import TagsInput from '@/elements/input/TagsInput';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { generateBackupName } from '@/lib/server';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps } from '@mantine/core';
import { useState } from 'react';

export default ({ opened, onClose }: ModalProps) => {
  const { addToast } = useToast();
  const { server, addBackup } = useServerStore();

  const [name, setName] = useState(generateBackupName());
  const [ignoredFiles, setIgnoredFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const doCreate = () => {
    setLoading(true);

    createBackup(server.uuid, { name, ignoredFiles })
      .then((backup) => {
        addBackup(backup);
        addToast('Backup created.', 'success');
        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={'Create Backup'} onClose={onClose} opened={opened}>
      <TextInput label={'Name'} placeholder={'Name'} value={name} onChange={(e) => setName(e.target.value)} mt={'sm'} />

      <TagsInput
        label={'Ignored Files'}
        placeholder={'Ignored Files'}
        value={ignoredFiles}
        onChange={setIgnoredFiles}
        mt={'sm'}
      />

      <Group mt={'md'}>
        <Button onClick={doCreate} loading={loading} disabled={!name}>
          Create
        </Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
