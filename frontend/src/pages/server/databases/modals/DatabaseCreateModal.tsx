import { httpErrorToHuman } from '@/api/axios';
import createDatabase from '@/api/server/databases/createDatabase';
import getDatabaseHosts from '@/api/server/databases/getDatabaseHosts';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';

export default ({ opened, onClose }: ModalProps) => {
  const { addToast } = useToast();
  const { server, addDatabase } = useServerStore();

  const [databaseHosts, setDatabaseHosts] = useState<DatabaseHost[]>([]);
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDatabaseHosts(server.uuid).then((data) => setDatabaseHosts(data));
  }, []);

  const doCreate = () => {
    load(true, setLoading);

    createDatabase(server.uuid, { databaseHostUuid: host, name })
      .then((database) => {
        addToast('Database created.', 'success');
        onClose();
        addDatabase(database);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'Create Database'} onClose={onClose} opened={opened}>
      <Stack>
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
              (acc, { uuid, name, type }) => (
                (acc[type] ??= { group: type, items: [] }).items.push({ value: uuid, label: name }), acc
              ),
              {},
            ),
          )}
          value={host}
          onChange={setHost}
        />

        <Group>
          <Button onClick={doCreate} loading={loading} disabled={!name || !host}>
            Create
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
