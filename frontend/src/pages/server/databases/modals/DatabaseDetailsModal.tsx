import { httpErrorToHuman } from '@/api/axios';
import rotateDatabasePassword from '@/api/server/databases/rotateDatabasePassword';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';

type Props = ModalProps & {
  database: ServerDatabase;
};

export default ({ database, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { server, databases, setDatabases } = useServerStore();
  const [loading, setLoading] = useState(false);

  const host = `${database.host}:${database.port}`;
  const jdbcConnectionString = `jdbc:${database.type}://${database.username}${
    database.password ? `:${encodeURIComponent(database.password)}` : ''
  }@${host}/${database.name}`;

  const onRotatePassword = () => {
    load(true, setLoading);

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
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <Modal title={'Database connection details'} onClose={onClose} opened={opened}>
      <Stack>
        <TextInput label={'Database Name'} placeholder={'Database Name'} value={database.name} disabled />
        <TextInput label={'Host'} placeholder={'Host'} value={host} disabled />
        <TextInput label={'Username'} placeholder={'Username'} value={database.username} disabled />
        <TextInput label={'Password'} placeholder={'Password'} value={database.password} disabled />
        <TextInput
          label={'JDBC Connection String'}
          placeholder={'JDBC Connection String'}
          value={jdbcConnectionString}
          disabled
        />

        <Group>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
          <Button color={'red'} onClick={onRotatePassword} loading={loading} disabled={database.isLocked}>
            Rotate Password
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
