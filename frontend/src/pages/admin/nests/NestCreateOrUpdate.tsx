import { Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import createNest from '@/api/admin/nests/createNest.ts';
import deleteNest from '@/api/admin/nests/deleteNest.ts';
import updateNest from '@/api/admin/nests/updateNest.ts';
import Button from '@/elements/Button.tsx';
import Code from '@/elements/Code.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextArea from '@/elements/input/TextArea.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import { adminNestSchema } from '@/lib/schemas/admin/nests.ts';
import { useResourceForm } from '@/plugins/useResourceForm.ts';

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
        author: contextNest.author,
        name: contextNest.name,
        description: contextNest.description,
      });
    }
  }, [contextNest]);

  return (
    <AdminContentContainer title={`${contextNest ? 'Update' : 'Create'} Nest`} titleOrder={2}>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title='Confirm Nest Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <form onSubmit={form.onSubmit(() => doCreateOrUpdate(false))}>
        <Stack mt='xs'>
          <Group grow>
            <TextInput withAsterisk label='Author' placeholder='Author' {...form.getInputProps('author')} />
            <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />
          </Group>

          <TextArea label='Description' placeholder='Description' rows={3} {...form.getInputProps('description')} />
        </Stack>

        <Group mt='md'>
          <Button type='submit' disabled={!form.isValid()} loading={loading}>
            Save
          </Button>
          {!contextNest && (
            <Button onClick={() => doCreateOrUpdate(true)} disabled={!form.isValid()} loading={loading}>
              Save & Stay
            </Button>
          )}
          {contextNest && (
            <Button color='red' onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>
      </form>
    </AdminContentContainer>
  );
}
