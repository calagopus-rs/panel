import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import createMount from '@/api/admin/mounts/createMount';
import deleteMount from '@/api/admin/mounts/deleteMount';
import updateMount from '@/api/admin/mounts/updateMount';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { useResourceForm } from '@/plugins/useResourceForm';

export default ({ contextMount }: { contextMount?: Mount }) => {
  const [openModal, setOpenModal] = useState<'delete'>(null);

  const form = useForm<UpdateAdminMount>({
    initialValues: {
      name: '',
      description: null,
      source: '',
      target: '',
      readOnly: false,
      userMountable: false,
    },
  });

  const { loading, doCreateOrUpdate, doDelete } = useResourceForm<UpdateAdminMount, Mount>({
    form,
    createFn: () => createMount(form.values),
    updateFn: () => updateMount(contextMount?.uuid, form.values),
    deleteFn: () => deleteMount(contextMount?.uuid),
    doUpdate: !!contextMount,
    basePath: '/admin/locations',
    resourceName: 'Location',
  });

  useEffect(() => {
    if (contextMount) {
      form.setValues({
        ...contextMount,
      });
    }
  }, [contextMount]);

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Mount Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Title order={2} mb={'md'}>
          {contextMount ? 'Update' : 'Create'} Mount
        </Title>

        <Group grow align={'start'}>
          <TextInput withAsterisk label={'Name'} placeholder={'Name'} {...form.getInputProps('name')} />
          <TextArea label={'Description'} placeholder={'Description'} {...form.getInputProps('description')} rows={3} />
        </Group>

        <Group grow>
          <TextInput withAsterisk label={'Source'} placeholder={'Source'} {...form.getInputProps('source')} />
          <TextInput withAsterisk label={'Target'} placeholder={'Target'} {...form.getInputProps('target')} />
        </Group>

        <Group grow>
          <Switch
            label={'Read Only'}
            checked={form.values.readOnly}
            onChange={(e) => form.setFieldValue('readOnly', e.target.checked)}
          />
          <Switch
            label={'User Mountable'}
            checked={form.values.userMountable}
            onChange={(e) => form.setFieldValue('userMountable', e.target.checked)}
          />
        </Group>

        <Group>
          <Button onClick={() => doCreateOrUpdate(false)} loading={loading}>
            Save
          </Button>
          {!contextMount && (
            <Button onClick={() => doCreateOrUpdate(true)} loading={loading}>
              Save & Stay
            </Button>
          )}
          {contextMount && (
            <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>
      </Stack>
    </>
  );
};
