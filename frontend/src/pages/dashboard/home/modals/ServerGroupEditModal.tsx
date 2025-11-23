import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios';
import updateServerGroup from '@/api/me/servers/groups/updateServerGroup';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';

const schema = z.object({
  name: z.string().min(2).max(31),
});

type Props = ModalProps & {
  serverGroup: UserServerGroup;
};

export default function ServerGroupEditModal({ serverGroup, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { updateServerGroup: updateStateServerGroup } = useUserStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      name: serverGroup.name,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
  });

  const doUpdate = () => {
    setLoading(true);

    updateServerGroup(serverGroup.uuid, form.values)
      .then(() => {
        updateStateServerGroup(serverGroup.uuid, form.values);

        onClose();
        addToast('Server group updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Edit Server Group' onClose={onClose} opened={opened}>
      <Stack>
        <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />

        <Group>
          <Button onClick={doUpdate} loading={loading} disabled={!form.isValid()}>
            Edit
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
