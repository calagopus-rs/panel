import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import createMount from '@/api/admin/mounts/createMount';
import deleteMount from '@/api/admin/mounts/deleteMount';
import updateMount from '@/api/admin/mounts/updateMount';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { adminMountSchema } from '@/lib/schemas/admin/mounts';
import { useResourceForm } from '@/plugins/useResourceForm';

export default function MountCreateOrUpdate({ contextMount }: { contextMount?: Mount }) {
  const [openModal, setOpenModal] = useState<'delete' | null>(null);

  const form = useForm<z.infer<typeof adminMountSchema>>({
    initialValues: {
      name: '',
      description: null,
      source: '',
      target: '',
      readOnly: false,
      userMountable: false,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminMountSchema),
  });

  const { loading, doCreateOrUpdate, doDelete } = useResourceForm<z.infer<typeof adminMountSchema>, Mount>({
    form,
    createFn: () => createMount(form.values),
    updateFn: () => updateMount(contextMount!.uuid, form.values),
    deleteFn: () => deleteMount(contextMount!.uuid),
    doUpdate: !!contextMount,
    basePath: '/admin/locations',
    resourceName: 'Location',
  });

  useEffect(() => {
    if (contextMount) {
      form.setValues({
        name: contextMount.name,
        description: contextMount.description,
        source: contextMount.source,
        target: contextMount.target,
        readOnly: contextMount.readOnly,
        userMountable: contextMount.userMountable,
      });
    }
  }, [contextMount]);

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title='Confirm Mount Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <form onSubmit={form.onSubmit(() => doCreateOrUpdate(false))}>
        <Stack>
          <Title order={2}>{contextMount ? 'Update' : 'Create'} Mount</Title>

          <Group grow align='start'>
            <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />
            <TextArea label='Description' placeholder='Description' {...form.getInputProps('description')} rows={3} />
          </Group>

          <Group grow>
            <TextInput withAsterisk label='Source' placeholder='Source' {...form.getInputProps('source')} />
            <TextInput withAsterisk label='Target' placeholder='Target' {...form.getInputProps('target')} />
          </Group>

          <Group grow>
            <Switch
              label='Read Only'
              checked={form.values.readOnly}
              onChange={(e) => form.setFieldValue('readOnly', e.target.checked)}
            />
            <Switch
              label='User Mountable'
              checked={form.values.userMountable}
              onChange={(e) => form.setFieldValue('userMountable', e.target.checked)}
            />
          </Group>

          <Group>
            <Button type='submit' disabled={!form.isValid()} loading={loading}>
              Save
            </Button>
            {!contextMount && (
              <Button onClick={() => doCreateOrUpdate(true)} disabled={!form.isValid()} loading={loading}>
                Save & Stay
              </Button>
            )}
            {contextMount && (
              <Button color='red' onClick={() => setOpenModal('delete')} loading={loading}>
                Delete
              </Button>
            )}
          </Group>
        </Stack>
      </form>
    </>
  );
}
