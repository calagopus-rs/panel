import { httpErrorToHuman } from '@/api/axios';
import updateBackup from '@/api/server/backups/updateBackup';
import Button from '@/elements/Button';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps } from '@mantine/core';
import { useState } from 'react';

type Props = ModalProps & {
  backup: ServerBackup;
};

export default ({ backup, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { server } = useServerStore();

  const [name, setName] = useState(backup.name);
  const [locked, setLocked] = useState<boolean>(backup.isLocked);

  const doUpdate = () => {
    updateBackup(server.uuid, backup.uuid, { name, locked })
      .then(() => {
        backup.name = name;
        backup.isLocked = locked;
        onClose();
        addToast('Backup updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Modal title={'Edit Backup'} onClose={onClose} opened={opened}>
      <TextInput label={'Name'} placeholder={'Name'} value={name} onChange={(e) => setName(e.target.value)} />

      <Switch
        label={'Locked'}
        name={'locked'}
        checked={locked}
        onChange={(e) => setLocked(e.target.checked)}
        mt={'sm'}
      />

      <Group mt={'md'}>
        <Button onClick={doUpdate} disabled={!name}>
          Save
        </Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
