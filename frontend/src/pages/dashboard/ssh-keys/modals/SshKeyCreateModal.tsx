import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import createSshKey from '@/api/me/ssh-keys/createSshKey.ts';
import Button from '@/elements/Button.tsx';
import TextArea from '@/elements/input/TextArea.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';

const schema = z.object({
  name: z.string().min(3).max(31),
  publicKey: z.string(),
});

export default function SshKeyCreateModal({ opened, onClose }: ModalProps) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { addSshKey } = useUserStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      name: '',
      publicKey: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
  });

  const doCreate = () => {
    setLoading(true);

    createSshKey(form.values)
      .then((key) => {
        addToast(t('pages.account.sshKeys.modal.createSshKey.toast.created', {}), 'success');

        onClose();
        addSshKey(key);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={t('pages.account.sshKeys.modal.createSshKey.title', {})} onClose={onClose} opened={opened}>
      <Stack>
        <TextInput
          withAsterisk
          label={t('common.form.name', {})}
          placeholder={t('common.form.name', {})}
          {...form.getInputProps('name')}
        />

        <TextArea
          withAsterisk
          label={t('pages.account.sshKeys.modal.createSshKey.form.publicKey', {})}
          placeholder={t('pages.account.sshKeys.modal.createSshKey.form.publicKey', {})}
          rows={3}
          resize='none'
          {...form.getInputProps('publicKey')}
        />

        <Group mt='md'>
          <Button onClick={doCreate} loading={loading} disabled={!form.isValid()}>
            {t('common.button.create', {})}
          </Button>
          <Button variant='default' onClick={onClose}>
            {t('common.button.close', {})}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
