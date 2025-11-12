import { Group, ModalProps, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import deleteDatabase from '@/api/server/databases/deleteDatabase';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

type Props = ModalProps & {
  database: ServerDatabase;
};

export default function DatabaseDeleteModal({ database, opened, onClose }: Props) {
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);
  const { removeDatabase } = useServerStore();

  const [enteredName, setEnteredName] = useState('');
  const [loading, setLoading] = useState(false);

  const doDelete = () => {
    setLoading(true);

    deleteDatabase(server.uuid, database.uuid)
      .then(() => {
        addToast('Database deleted.', 'success');
        onClose();
        removeDatabase(database);
      })
      .catch((error) => {
        console.error(error);
        addToast(httpErrorToHuman(error), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={'Confirm Database Deletion'} onClose={onClose} opened={opened}>
      <Stack>
        <Text>
          Deleting a database is a permanent action, it cannot be undone. This will permanently delete the
          <Code>{database.name}</Code> database and remove all associated data.
        </Text>

        <TextInput
          withAsterisk
          label={'Database Name'}
          placeholder={'Database Name'}
          value={enteredName}
          onChange={(e) => setEnteredName(e.target.value)}
        />

        <Group>
          <Button color={'red'} onClick={doDelete} loading={loading} disabled={database.name !== enteredName}>
            Delete
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
