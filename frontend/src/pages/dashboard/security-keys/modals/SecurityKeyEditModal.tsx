import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios';
import updateSecurityKey from '@/api/me/security-keys/updateSecurityKey';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';

const schema = z.object({
  name: z.string().min(3).max(31),
});

type Props = ModalProps & {
  securityKey: UserSecurityKey;
};

export default function SecurityKeyEditModal({ securityKey, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { updateSecurityKey: updateStateSecurityKey } = useUserStore();

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
      name: securityKey.name,
    });
  }, []);

  const doUpdate = () => {
    setLoading(true);

    updateSecurityKey(securityKey.uuid, form.values)
      .then(() => {
        updateStateSecurityKey(securityKey.uuid, form.values);

        onClose();
        addToast('Security Key updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Edit Security Key' onClose={onClose} opened={opened}>
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
