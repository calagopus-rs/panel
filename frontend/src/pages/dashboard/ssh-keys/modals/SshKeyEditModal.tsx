import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import updateSshKey from '@/api/me/ssh-keys/updateSshKey.ts';
import Button from '@/elements/Button.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useUserStore } from '@/stores/user.ts';

const schema = z.object({
  name: z.string().min(3).max(31),
});

type Props = ModalProps & {
  sshKey: UserSshKey;
};

export default function SshKeyEditModal({ sshKey, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { updateSshKey: updateStateSshKey } = useUserStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      name: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
  });

  useEffect(() => {
    form.setValues({
      name: sshKey.name,
    });
  }, []);

  const doUpdate = () => {
    setLoading(true);

    updateSshKey(sshKey.uuid, form.values)
      .then(() => {
        updateStateSshKey(sshKey.uuid, form.values);

        onClose();
        addToast('SSH Key updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Edit SSH Key' onClose={onClose} opened={opened}>
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
