import { httpErrorToHuman } from '@/api/axios';
import updateBackup from '@/api/server/backups/updateBackup';
import Button from '@/elements/Button';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';

type Props = ModalProps & {
  backup: ServerBackup;
};

export default ({ backup, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { server } = useServerStore();

  const [name, setName] = useState(backup.name);
  const [locked, setLocked] = useState<boolean>(backup.isLocked);
  const [loading, setLoading] = useState(false);

  const doUpdate = () => {
    load(true, setLoading);

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
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'Edit Backup'} onClose={onClose} opened={opened}>
      <Stack>
        <TextInput label={'Name'} placeholder={'Name'} value={name} onChange={(e) => setName(e.target.value)} />

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
};
