import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useToast } from '@/providers/ToastProvider';
import { Group, Title, Divider, Stack } from '@mantine/core';
import { httpErrorToHuman } from '@/api/axios';
import updateDatabaseHost from '@/api/admin/database-hosts/updateDatabaseHost';
import createDatabaseHost from '@/api/admin/database-hosts/createDatabaseHost';
import deleteDatabaseHost from '@/api/admin/database-hosts/deleteDatabaseHost';
import testDatabaseHost from '@/api/admin/database-hosts/testDatabaseHost';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import NumberInput from '@/elements/input/NumberInput';
import Switch from '@/elements/input/Switch';
import Select from '@/elements/input/Select';
import { load } from '@/lib/debounce';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { databaseTypeLabelMapping } from '@/lib/enums';
import { useForm } from '@mantine/form';
import { useResourceForm } from '@/plugins/useResourceForm';

export default ({ contextDatabaseHost }: { contextDatabaseHost?: AdminDatabaseHost }) => {
  const { addToast } = useToast();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const form = useForm<UpdateAdminDatabaseHost>({
    initialValues: {
      name: '',
      username: '',
      password: null,
      host: '',
      port: 3306,
      public: false,
      publicHost: null,
      publicPort: null,
      type: 'mysql',
    },
  });

  const { loading, setLoading, doCreateOrUpdate, doDelete } = useResourceForm<
    UpdateAdminDatabaseHost,
    AdminDatabaseHost
  >({
    form,
    createFn: () => createDatabaseHost(form.values),
    updateFn: () => updateDatabaseHost(contextDatabaseHost?.uuid, form.values),
    deleteFn: () => deleteDatabaseHost(contextDatabaseHost?.uuid),
    doUpdate: !!contextDatabaseHost,
    basePath: '/admin/database-hosts',
    resourceName: 'Database host',
  });

  useEffect(() => {
    if (contextDatabaseHost) {
      form.setValues({
        ...contextDatabaseHost,
        password: null,
      });
    }
  }, [contextDatabaseHost]);

  const doTest = () => {
    load(true, setLoading);
    testDatabaseHost(contextDatabaseHost.uuid)
      .then(() => {
        addToast('Test successfully completed', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Database Host Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Title order={2} mb={'md'}>
        {contextDatabaseHost ? 'Update' : 'Create'} Database Host
      </Title>
      <Divider mb={'md'} />

      <Stack>
        <Group grow>
          <TextInput withAsterisk label={'Name'} placeholder={'Name'} {...form.getInputProps('name')} />
          <Select
            withAsterisk
            label={'Type'}
            data={Object.entries(databaseTypeLabelMapping).map(([value, label]) => ({
              value,
              label,
            }))}
            disabled={!!contextDatabaseHost}
            {...form.getInputProps('type')}
          />
        </Group>

        <Group grow>
          <TextInput withAsterisk label={'Username'} placeholder={'Username'} {...form.getInputProps('username')} />
          <TextInput
            withAsterisk={!contextDatabaseHost}
            label={'Password'}
            placeholder={'Password'}
            type={'password'}
            {...form.getInputProps('password')}
          />
        </Group>

        <Group grow>
          <TextInput withAsterisk label={'Host'} placeholder={'Host'} {...form.getInputProps('host')} />
          <NumberInput withAsterisk label={'Port'} placeholder={'Port'} min={0} {...form.getInputProps('port')} />
        </Group>

        <Group grow>
          <TextInput label={'Public Host'} placeholder={'Public Host'} {...form.getInputProps('publicHost')} />
          <NumberInput
            label={'Public Port'}
            placeholder={'Public Port'}
            min={0}
            {...form.getInputProps('publicPort')}
          />
        </Group>

        <Switch label={'Public'} {...form.getInputProps('public')} />

        <Group>
          <Button onClick={() => doCreateOrUpdate(false)} loading={loading}>
            Save
          </Button>
          {!contextDatabaseHost && (
            <Button onClick={() => doCreateOrUpdate(true)} loading={loading}>
              Save & Stay
            </Button>
          )}
          {contextDatabaseHost && (
            <>
              <Button variant={'outline'} onClick={doTest} loading={loading}>
                Test
              </Button>
              <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
                Delete
              </Button>
            </>
          )}
        </Group>
      </Stack>
    </>
  );
};
