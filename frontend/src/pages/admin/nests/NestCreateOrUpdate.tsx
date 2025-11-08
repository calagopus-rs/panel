import { useEffect, useState } from 'react';
import Code from '@/elements/Code';
import updateNest from '@/api/admin/nests/updateNest';
import deleteNest from '@/api/admin/nests/deleteNest';
import createNest from '@/api/admin/nests/createNest';
import { Group, Stack, Title } from '@mantine/core';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import TextArea from '@/elements/input/TextArea';
import { useForm } from '@mantine/form';
import { useResourceForm } from '@/plugins/useResourceForm';

export default ({ contextNest }: { contextNest?: AdminNest }) => {
  const [openModal, setOpenModal] = useState<'delete'>(null);

  const form = useForm<AdminUpdateNest>({
    initialValues: {
      author: '',
      name: '',
      description: '',
    },
  });

  const { loading, doCreateOrUpdate, doDelete } = useResourceForm<AdminUpdateNest, AdminNest>({
    form,
    createFn: () => createNest(form.values),
    updateFn: () => updateNest(contextNest?.uuid, form.values),
    deleteFn: () => deleteNest(contextNest?.uuid),
    doUpdate: !!contextNest,
    basePath: '/admin/nests',
    resourceName: 'Nest',
  });

  useEffect(() => {
    if (contextNest) {
      form.setValues({
        ...contextNest,
      });
    }
  }, [contextNest]);

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Nest Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Title order={2} mb={'md'}>
        {contextNest ? 'Update' : 'Create'} Nest
      </Title>

      <Stack>
        <Group grow>
          <TextInput withAsterisk label={'Author'} placeholder={'Author'} {...form.getInputProps('author')} />
          <TextInput withAsterisk label={'Name'} placeholder={'Name'} {...form.getInputProps('name')} />
        </Group>

        <TextArea label={'Description'} placeholder={'Description'} rows={3} {...form.getInputProps('description')} />
      </Stack>

      <Group mt={'md'}>
        <Button onClick={() => doCreateOrUpdate(false)} loading={loading}>
          Save
        </Button>
        {!contextNest && (
          <Button onClick={() => doCreateOrUpdate(true)} loading={loading}>
            Save & Stay
          </Button>
        )}
        {contextNest && (
          <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
            Delete
          </Button>
        )}
      </Group>
    </>
  );
};
