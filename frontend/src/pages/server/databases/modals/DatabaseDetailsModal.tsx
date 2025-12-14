import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import rotateDatabasePassword from '@/api/server/databases/rotateDatabasePassword.ts';
import Button from '@/elements/Button.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

type Props = ModalProps & {
  database: ServerDatabase;
};

export default function DatabaseDetailsModal({ database, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { server, databases, setDatabases } = useServerStore();
  const [loading, setLoading] = useState(false);

  const host = `${database.host}:${database.port}`;
  const jdbcConnectionString = `jdbc:${database.type}://${database.username}${
    database.password ? `:${encodeURIComponent(database.password)}` : ''
  }@${host}/${database.name}`;

  const onRotatePassword = () => {
    setLoading(true);

    rotateDatabasePassword(server.uuid, database.uuid)
      .then((password) => {
        addToast('Password has been rotated.', 'success');
        setDatabases({
          ...databases,
          data: databases.data.map((db) => (db.uuid === database.uuid ? { ...db, password } : db)),
        });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Database connection details' onClose={onClose} opened={opened}>
      <Stack>
        <TextInput label='Database Name' placeholder='Database Name' value={database.name} disabled />
        <TextInput label='Host' placeholder='Host' value={host} disabled />
        <TextInput label='Username' placeholder='Username' value={database.username} disabled />
        <TextInput label='Password' placeholder='Password' value={database.password ?? ''} disabled />
        <TextInput
          label='JDBC Connection String'
          placeholder='JDBC Connection String'
          value={jdbcConnectionString}
          disabled
        />

        <Group>
          <Button color='red' onClick={onRotatePassword} loading={loading} disabled={database.isLocked}>
            Rotate Password
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
