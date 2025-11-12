import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import updateBackup from '@/api/server/backups/updateBackup';
import Button from '@/elements/Button';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

type Props = ModalProps & {
  backup: ServerBackup;
};

export default function BackupEditModal({ backup, opened, onClose }: Props) {
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);

  const [name, setName] = useState(backup.name);
  const [locked, setLocked] = useState<boolean>(backup.isLocked);
  const [loading, setLoading] = useState(false);

  const doUpdate = () => {
    setLoading(false);

    updateBackup(server.uuid, backup.uuid, { name, locked })
      .then(() => {
        backup.name = name;
        backup.isLocked = locked;
        onClose();
        addToast('Backup updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={'Edit Backup'} onClose={onClose} opened={opened}>
      <Stack>
        <TextInput
          withAsterisk
          label={'Name'}
          placeholder={'Name'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Switch label={'Locked'} name={'locked'} checked={locked} onChange={(e) => setLocked(e.target.checked)} />

        <Group>
          <Button onClick={doUpdate} loading={loading} disabled={!name}>
            Save
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
