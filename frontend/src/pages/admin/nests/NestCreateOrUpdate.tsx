import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import createNest from '@/api/admin/nests/createNest';
import deleteNest from '@/api/admin/nests/deleteNest';
import updateNest from '@/api/admin/nests/updateNest';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { adminNestSchema } from '@/lib/schemas';
import { useResourceForm } from '@/plugins/useResourceForm';

export default function NestCreateOrUpdate({ contextNest }: { contextNest?: AdminNest }) {
  const [openModal, setOpenModal] = useState<'delete' | null>(null);

  const form = useForm<z.infer<typeof adminNestSchema>>({
    initialValues: {
      author: '',
      name: '',
      description: null,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminNestSchema),
  });

  const { loading, doCreateOrUpdate, doDelete } = useResourceForm<z.infer<typeof adminNestSchema>, AdminNest>({
    form,
    createFn: () => createNest(form.values),
    updateFn: () => updateNest(contextNest!.uuid, form.values),
    deleteFn: () => deleteNest(contextNest!.uuid),
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
        title='Confirm Nest Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Title order={2}>{contextNest ? 'Update' : 'Create'} Nest</Title>

        <Group grow>
          <TextInput withAsterisk label='Author' placeholder='Author' {...form.getInputProps('author')} />
          <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />
        </Group>

        <TextArea label='Description' placeholder='Description' rows={3} {...form.getInputProps('description')} />
      </Stack>

      <Group mt='md'>
        <Button onClick={() => doCreateOrUpdate(false)} loading={loading}>
          Save
        </Button>
        {!contextNest && (
          <Button onClick={() => doCreateOrUpdate(true)} loading={loading}>
            Save & Stay
          </Button>
        )}
        {contextNest && (
          <Button color='red' onClick={() => setOpenModal('delete')} loading={loading}>
            Delete
          </Button>
        )}
      </Group>
    </>
  );
}
