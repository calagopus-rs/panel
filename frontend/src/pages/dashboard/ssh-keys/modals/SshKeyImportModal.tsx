import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import importSshKeys from '@/api/me/ssh-keys/importSshKeys.ts';
import Button from '@/elements/Button.tsx';
import Select from '@/elements/input/Select.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { sshKeyProviderLabelMapping } from '@/lib/enums.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';

const schema = z.object({
  provider: z.enum(['github', 'gitlab', 'launchpad']),
  username: z.string().min(3).max(31),
});

export default function SshKeyImportModal({ opened, onClose }: ModalProps) {
  const { t, tItem } = useTranslations();
  const { addToast } = useToast();
  const { addSshKey } = useUserStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      provider: 'github',
      username: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
  });

  const doImport = () => {
    setLoading(true);

    importSshKeys(form.values)
      .then((keys) => {
        addToast(
          t('pages.account.sshKeys.modal.importSshKeys.toast.created', { sshKeys: tItem('sshKey', keys.length) }),
          'success',
        );
        for (const key of keys) {
          addSshKey(key);
        }

        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={t('pages.account.sshKeys.modal.importSshKeys.title', {})} onClose={onClose} opened={opened}>
      <Stack>
        <div className='grid grid-cols-3 gap-2'>
          <Select
            withAsterisk
            label={t('pages.account.sshKeys.modal.importSshKeys.form.provider', {})}
            data={Object.entries(sshKeyProviderLabelMapping).map(([value, label]) => ({
              label,
              value,
            }))}
            {...form.getInputProps('provider')}
          />

          <TextInput
            withAsterisk
            label={t('pages.account.sshKeys.modal.importSshKeys.form.username', {})}
            placeholder={t('pages.account.sshKeys.modal.importSshKeys.form.username', {})}
            className='col-span-2'
            {...form.getInputProps('username')}
          />
        </div>

        <Group mt='md'>
          <Button onClick={doImport} loading={loading} disabled={!form.isValid()}>
            {t('pages.account.sshKeys.button.import', {})}
          </Button>
          <Button variant='default' onClick={onClose}>
            {t('common.button.close', {})}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
