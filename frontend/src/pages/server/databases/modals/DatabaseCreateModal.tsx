import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import createDatabase from '@/api/server/databases/createDatabase.ts';
import getDatabaseHosts from '@/api/server/databases/getDatabaseHosts.ts';
import Button from '@/elements/Button.tsx';
import Select from '@/elements/input/Select.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { databaseTypeLabelMapping } from '@/lib/enums.ts';
import { serverDatabaseCreateSchema } from '@/lib/schemas/server/databases.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

export default function DatabaseCreateModal({ opened, onClose }: ModalProps) {
  const { addToast } = useToast();
  const { server, addDatabase } = useServerStore();

  const [databaseHosts, setDatabaseHosts] = useState<DatabaseHost[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverDatabaseCreateSchema>>({
    initialValues: {
      name: '',
      databaseHostUuid: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverDatabaseCreateSchema),
  });

  useEffect(() => {
    getDatabaseHosts(server.uuid).then((data) => setDatabaseHosts(data));
  }, []);

  const doCreate = () => {
    setLoading(true);

    createDatabase(server.uuid, form.values)
      .then((database) => {
        addToast('Database created.', 'success');
        onClose();
        addDatabase(database);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Create Database' onClose={onClose} opened={opened}>
      <form onSubmit={form.onSubmit(() => doCreate())}>
        <Stack>
          <TextInput withAsterisk label='Database Name' placeholder='Database Name' {...form.getInputProps('name')} />

          <Select
            withAsterisk
            label='Database Host'
            placeholder='Database Host'
            searchable
            nothingFoundMessage='No hosts found'
            data={Object.values(
              databaseHosts.reduce(
                (acc, { uuid, name, type }) => (
                  (acc[type] ??= { group: databaseTypeLabelMapping[type], items: [] }).items.push({
                    value: uuid,
                    label: name,
                  }),
                  acc
                ),
                {} as GroupedDatabaseHosts,
              ),
            )}
            {...form.getInputProps('databaseHostUuid')}
          />

          <Group>
            <Button type='submit' loading={loading} disabled={!form.isValid()}>
              Create
            </Button>
            <Button variant='default' onClick={onClose}>
              Close
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
