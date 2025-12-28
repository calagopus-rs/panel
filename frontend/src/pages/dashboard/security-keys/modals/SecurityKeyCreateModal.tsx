import { Group, ModalProps } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import createSecurityKey from '@/api/me/security-keys/createSecurityKey.ts';
import deleteSecurityKey from '@/api/me/security-keys/deleteSecurityKey.ts';
import postSecurityKeyChallenge from '@/api/me/security-keys/postSecurityKeyChallenge.ts';
import Button from '@/elements/Button.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';

const schema = z.object({
  name: z.string().min(3).max(31),
});

export default function SecurityKeyCreateModal({ opened, onClose }: ModalProps) {
  const { t } = useTranslations();
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
                addToast(t('pages.account.securityKeys.modal.createSecurityKey.toast.created', {}), 'success');
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
            addToast(t('pages.account.securityKeys.modal.createSecurityKey.toast.aborted', {}), 'error');
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
    <Modal title={t('pages.account.securityKeys.modal.createSecurityKey.title', {})} onClose={onClose} opened={opened}>
      <TextInput
        withAsterisk
        label={t('common.form.name', {})}
        placeholder={t('common.form.name', {})}
        {...form.getInputProps('name')}
      />

      <Group mt='md'>
        <Button onClick={doCreate} loading={loading} disabled={!form.isValid()}>
          {t('common.button.create', {})}
        </Button>
        <Button variant='default' onClick={onClose}>
          {t('common.button.close', {})}
        </Button>
      </Group>
    </Modal>
  );
}
