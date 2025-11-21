import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import updateDatabase from '@/api/server/databases/updateDatabase';
import Button from '@/elements/Button';
import Switch from '@/elements/input/Switch';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

type Props = ModalProps & {
  database: ServerDatabase;
};

export default function DatabaseEditModal({ database, opened, onClose }: Props) {
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);

  const [locked, setLocked] = useState<boolean>(database.isLocked);
  const [loading, setLoading] = useState(false);

  const doUpdate = () => {
    setLoading(true);

    updateDatabase(server.uuid, database.uuid, { locked })
      .then(() => {
        database.isLocked = locked;
        onClose();
        addToast('Database updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Edit Database' onClose={onClose} opened={opened}>
      <Stack>
        <Switch label='Locked' name='locked' checked={locked} onChange={(e) => setLocked(e.target.checked)} />

        <Group>
          <Button onClick={doUpdate} loading={loading}>
            Save
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
