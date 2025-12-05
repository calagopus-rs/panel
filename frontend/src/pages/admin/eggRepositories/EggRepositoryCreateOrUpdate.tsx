import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import createEggRepository from '@/api/admin/egg-repositories/createEggRepository';
import deleteEggRepository from '@/api/admin/egg-repositories/deleteEggRepository';
import syncEggRepository from '@/api/admin/egg-repositories/syncEggRepository';
import updateEggRepository from '@/api/admin/egg-repositories/updateEggRepository';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { adminEggRepositorySchema } from '@/lib/schemas';
import { useResourceForm } from '@/plugins/useResourceForm';
import { useToast } from '@/providers/ToastProvider';

export default function EggRepositoryCreateOrUpdate({
  contextEggRepository,
}: {
  contextEggRepository?: AdminEggRepository;
}) {
  const { addToast } = useToast();

  const [openModal, setOpenModal] = useState<'delete' | null>(null);

  const form = useForm<z.infer<typeof adminEggRepositorySchema>>({
    initialValues: {
      name: '',
      description: null,
      gitRepository: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminEggRepositorySchema),
  });

  const { loading, setLoading, doCreateOrUpdate, doDelete } = useResourceForm<
    AdminUpdateEggRepository,
    AdminEggRepository
  >({
    form,
    createFn: () => createEggRepository(form.values),
    updateFn: () => updateEggRepository(contextEggRepository!.uuid, form.values),
    deleteFn: () => deleteEggRepository(contextEggRepository!.uuid),
    doUpdate: !!contextEggRepository,
    basePath: '/admin/egg-repositories',
    resourceName: 'Egg Repository',
  });

  useEffect(() => {
    if (contextEggRepository) {
      form.setValues({
        ...contextEggRepository,
      });
    }
  }, [contextEggRepository]);

  const doSync = () => {
    setLoading(true);
    syncEggRepository(contextEggRepository!.uuid)
      .then((found) => {
        addToast(`Egg Repository synchronised, found ${found} Egg${found === 1 ? '' : 's'}.`, 'success');
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
        title='Confirm Nest Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Title order={2}>{contextEggRepository ? 'Update' : 'Create'} Egg Repository</Title>

        <Group grow>
          <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />
          <TextInput
            withAsterisk
            label='Git Repository'
            placeholder='Git Repository'
            {...form.getInputProps('gitRepository')}
          />
        </Group>

        <TextArea label='Description' placeholder='Description' rows={3} {...form.getInputProps('description')} />
      </Stack>

      <Group mt='md'>
        <Button onClick={() => doCreateOrUpdate(false)} disabled={!form.isValid()} loading={loading}>
          Save
        </Button>
        {!contextEggRepository && (
          <Button onClick={() => doCreateOrUpdate(true)} disabled={!form.isValid()} loading={loading}>
            Save & Stay
          </Button>
        )}
        {contextEggRepository && (
          <Button variant='outline' onClick={doSync} loading={loading}>
            Sync
          </Button>
        )}
        {contextEggRepository && (
          <Button color='red' onClick={() => setOpenModal('delete')} loading={loading}>
            Delete
          </Button>
        )}
      </Group>
    </>
  );
}
