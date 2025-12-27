import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import updateBackup from '@/api/server/backups/updateBackup.ts';
import Button from '@/elements/Button.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { serverBackupEditSchema } from '@/lib/schemas/server/backups.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

type Props = ModalProps & {
  backup: ServerBackup;
};

export default function BackupEditModal({ backup, opened, onClose }: Props) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverBackupEditSchema>>({
    initialValues: {
      name: backup.name,
      locked: backup.isLocked,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverBackupEditSchema),
  });

  const doUpdate = () => {
    setLoading(false);

    updateBackup(server.uuid, backup.uuid, form.values)
      .then(() => {
        backup.name = form.values.name;
        backup.isLocked = form.values.locked;
        onClose();
        addToast(t('pages.server.backups.modal.editBackup.toast.updated', {}), 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={t('pages.server.backups.modal.editBackup.title', {})} onClose={onClose} opened={opened}>
      <form onSubmit={form.onSubmit(() => doUpdate())}>
        <Stack>
          <TextInput
            withAsterisk
            label={t('common.form.name', {})}
            placeholder={t('common.form.name', {})}
            {...form.getInputProps('name')}
          />

          <Switch
            label={t('pages.server.backups.modal.editBackup.form.locked', {})}
            name='locked'
            checked={form.values.locked}
            onChange={(e) => form.setFieldValue('locked', e.target.checked)}
          />

          <Group>
            <Button type='submit' loading={loading} disabled={!form.isValid()}>
              {t('common.button.save', {})}
            </Button>
            <Button variant='default' onClick={onClose}>
              {t('common.button.close', {})}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
