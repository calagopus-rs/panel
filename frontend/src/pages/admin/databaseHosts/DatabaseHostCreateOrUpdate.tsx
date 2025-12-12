import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import createDatabaseHost from '@/api/admin/database-hosts/createDatabaseHost';
import deleteDatabaseHost from '@/api/admin/database-hosts/deleteDatabaseHost';
import testDatabaseHost from '@/api/admin/database-hosts/testDatabaseHost';
import updateDatabaseHost from '@/api/admin/database-hosts/updateDatabaseHost';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import NumberInput from '@/elements/input/NumberInput';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { databaseTypeLabelMapping } from '@/lib/enums';
import { adminDatabaseHostSchema } from '@/lib/schemas/admin/databaseHosts';
import { useResourceForm } from '@/plugins/useResourceForm';
import { useToast } from '@/providers/ToastProvider';

export default function DatabaseHostCreateOrUpdate({
  contextDatabaseHost,
}: {
  contextDatabaseHost?: AdminDatabaseHost;
}) {
  const { addToast } = useToast();

  const [openModal, setOpenModal] = useState<'delete' | null>(null);

  const form = useForm<z.infer<typeof adminDatabaseHostSchema>>({
    initialValues: {
      name: '',
      username: '',
      password: '',
      host: '',
      port: 3306,
      public: false,
      publicHost: null,
      publicPort: null,
      type: 'mysql',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminDatabaseHostSchema),
  });

  const { loading, setLoading, doCreateOrUpdate, doDelete } = useResourceForm<
    z.infer<typeof adminDatabaseHostSchema>,
    AdminDatabaseHost
  >({
    form,
    createFn: () => createDatabaseHost(form.values),
    updateFn: () => updateDatabaseHost(contextDatabaseHost!.uuid, form.values),
    deleteFn: () => deleteDatabaseHost(contextDatabaseHost!.uuid),
    doUpdate: !!contextDatabaseHost,
    basePath: '/admin/database-hosts',
    resourceName: 'Database host',
  });

  useEffect(() => {
    if (contextDatabaseHost) {
      form.setValues({
        name: contextDatabaseHost.name,
        username: contextDatabaseHost.username,
        password: '',
        host: contextDatabaseHost.host,
        port: contextDatabaseHost.port,
        public: contextDatabaseHost.public,
        publicHost: contextDatabaseHost.publicHost,
        publicPort: contextDatabaseHost.publicPort,
        type: contextDatabaseHost.type,
      });
    }
  }, [contextDatabaseHost]);

  const doTest = () => {
    setLoading(true);
    testDatabaseHost(contextDatabaseHost!.uuid)
      .then(() => {
        addToast('Test successfully completed', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title='Confirm Database Host Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Title order={2}>{contextDatabaseHost ? 'Update' : 'Create'} Database Host</Title>

        <Group grow>
          <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />
          <Select
            withAsterisk
            label='Type'
            data={Object.entries(databaseTypeLabelMapping).map(([value, label]) => ({
              value,
              label,
            }))}
            disabled={!!contextDatabaseHost}
            {...form.getInputProps('type')}
          />
        </Group>

        <Group grow>
          <TextInput withAsterisk label='Username' placeholder='Username' {...form.getInputProps('username')} />
          <TextInput
            withAsterisk={!contextDatabaseHost}
            label='Password'
            placeholder='Password'
            type='password'
            {...form.getInputProps('password')}
          />
        </Group>

        <Group grow>
          <TextInput withAsterisk label='Host' placeholder='Host' {...form.getInputProps('host')} />
          <NumberInput withAsterisk label='Port' placeholder='Port' min={0} {...form.getInputProps('port')} />
        </Group>

        <Group grow>
          <TextInput label='Public Host' placeholder='Public Host' {...form.getInputProps('publicHost')} />
          <NumberInput label='Public Port' placeholder='Public Port' min={0} {...form.getInputProps('publicPort')} />
        </Group>

        <Switch
          label='Public'
          checked={form.values.public}
          onChange={(e) => form.setFieldValue('public', e.target.checked)}
        />

        <Group>
          <Button onClick={() => doCreateOrUpdate(false)} disabled={!form.isValid()} loading={loading}>
            Save
          </Button>
          {!contextDatabaseHost && (
            <Button onClick={() => doCreateOrUpdate(true)} disabled={!form.isValid()} loading={loading}>
              Save & Stay
            </Button>
          )}
          {contextDatabaseHost && (
            <>
              <Button variant='outline' onClick={doTest} loading={loading}>
                Test
              </Button>
              <Button color='red' onClick={() => setOpenModal('delete')} loading={loading}>
                Delete
              </Button>
            </>
          )}
        </Group>
      </Stack>
    </>
  );
}
