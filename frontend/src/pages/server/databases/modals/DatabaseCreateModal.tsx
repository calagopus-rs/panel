import { httpErrorToHuman } from '@/api/axios';
import createDatabase from '@/api/server/databases/createDatabase';
import getDatabaseHosts from '@/api/server/databases/getDatabaseHosts';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps } from '@mantine/core';
import { useEffect, useState } from 'react';

export default ({ opened, onClose }: ModalProps) => {
  const { addToast } = useToast();
  const { server, addDatabase } = useServerStore();

  const [databaseHosts, setDatabaseHosts] = useState<DatabaseHost[]>([]);
  const [name, setName] = useState('');
  const [host, setHost] = useState('');

  useEffect(() => {
    getDatabaseHosts(server.uuid).then((data) => setDatabaseHosts(data));
  }, []);

  const doCreate = () => {
    createDatabase(server.uuid, { databaseHostUuid: host, name })
      .then((database) => {
        addToast('Database created.', 'success');
        onClose();
        addDatabase(database);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Modal title={'Create Database'} onClose={onClose} opened={opened}>
      <TextInput
        label={'Database Name'}
        placeholder={'Database Name'}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Select
        label={'Database Host'}
        placeholder={'Database Host'}
        searchable
        nothingFoundMessage={'No hosts found'}
        data={Object.values(
          databaseHosts.reduce(
            (acc, { name, type }) => ((acc[type] ??= { group: type, items: [] }).items.push(name), acc),
            {},
          ),
        )}
        value={host}
        onChange={setHost}
        mt={'sm'}
      />

      <Group mt={'md'}>
        <Button onClick={doCreate} disabled={!name || !host}>
          Create
        </Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
