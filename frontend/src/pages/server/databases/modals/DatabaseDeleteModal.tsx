import { httpErrorToHuman } from '@/api/axios';
import deleteDatabase from '@/api/server/databases/deleteDatabase';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps } from '@mantine/core';
import { useState } from 'react';

type Props = ModalProps & {
  database: ServerDatabase;
};

export default ({ database, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);
  const { removeDatabase } = useServerStore();

  const [enteredName, setEnteredName] = useState('');
  const [loading, setLoading] = useState(false);

  const doDelete = () => {
    load(true, setLoading);

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
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'Confirm Database Deletion'} onClose={onClose} opened={opened}>
      <p>
        Deleting a database is a permanent action, it cannot be undone. This will permanently delete the
        <Code>{database.name}</Code> database and remove all associated data.
      </p>

      <TextInput
        label={'Database Name'}
        placeholder={'Database Name'}
        value={enteredName}
        onChange={(e) => setEnteredName(e.target.value)}
        mt={'sm'}
      />

      <Group mt={'md'}>
        <Button color={'red'} onClick={doDelete} loading={loading} disabled={database.name !== enteredName}>
          Delete
        </Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
