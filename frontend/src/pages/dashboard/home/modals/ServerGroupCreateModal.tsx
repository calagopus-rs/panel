import { Group, ModalProps } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod/v4';
import { httpErrorToHuman } from '@/api/axios';
import createServerGroup from '@/api/me/servers/groups/createServerGroup';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';

const schema = z.object({
  name: z.string().min(2).max(31),
});

export default function ServerGroupCreateModal({ opened, onClose }: ModalProps) {
  const { addToast } = useToast();
  const { addServerGroup } = useUserStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      name: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
  });

  const doCreate = () => {
    setLoading(true);

    createServerGroup({
      name: form.values.name,
      serverOrder: [],
    })
      .then((serverGroup) => {
        addServerGroup(serverGroup);
        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Create Server Group' onClose={onClose} opened={opened}>
      <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />

      <Group mt='md'>
        <Button onClick={doCreate} loading={loading} disabled={!form.isValid()}>
          Create
        </Button>
        <Button variant='default' onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
}
