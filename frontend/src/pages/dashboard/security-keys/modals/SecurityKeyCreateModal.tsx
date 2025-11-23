import { Group, ModalProps } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod/v4';
import { httpErrorToHuman } from '@/api/axios';
import createSecurityKey from '@/api/me/security-keys/createSecurityKey';
import deleteSecurityKey from '@/api/me/security-keys/deleteSecurityKey';
import postSecurityKeyChallenge from '@/api/me/security-keys/postSecurityKeyChallenge';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';

const schema = z.object({
  name: z.string().min(3).max(31),
});

export default function SecurityKeyCreateModal({ opened, onClose }: ModalProps) {
  const { addToast } = useToast();
  const { addSecurityKey } = useUserStore();

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

    createSecurityKey(form.values)
      .then(([key, options]) => {
        window.navigator.credentials
          .create(options)
          .then((credential) => {
            postSecurityKeyChallenge(key.uuid, credential as PublicKeyCredential)
              .then(() => {
                addSecurityKey(key);
                onClose();
              })
              .catch((error) => {
                console.error(error);
                addToast(httpErrorToHuman(error), 'error');
                deleteSecurityKey(key.uuid);
              })
              .finally(() => {
                setLoading(false);
              });
          })
          .catch((error) => {
            console.error(error);
            addToast('Security Key add operation was aborted.', 'error');
            deleteSecurityKey(key.uuid);
            setLoading(false);
          });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
        setLoading(false);
      });
  };

  return (
    <Modal title='Create Security Key' onClose={onClose} opened={opened}>
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
