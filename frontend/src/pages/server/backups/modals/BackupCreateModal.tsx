import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import createBackup from '@/api/server/backups/createBackup.ts';
import Button from '@/elements/Button.tsx';
import TagsInput from '@/elements/input/TagsInput.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { serverBackupCreateSchema } from '@/lib/schemas/server/backups.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

export default function BackupCreateModal({ opened, onClose }: ModalProps) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { server, addBackup } = useServerStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverBackupCreateSchema>>({
    initialValues: {
      name: '',
      ignoredFiles: [],
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverBackupCreateSchema),
  });

  const doCreate = () => {
    setLoading(true);

    createBackup(server.uuid, form.values)
      .then((backup) => {
        addBackup(backup);
        addToast(t('pages.server.backups.modal.createBackup.toast.created', {}), 'success');
        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={t('pages.server.backups.modal.createBackup.title', {})} onClose={onClose} opened={opened}>
      <form onSubmit={form.onSubmit(() => doCreate())}>
        <Stack>
          <TextInput
            withAsterisk
            label={t('common.form.name', {})}
            placeholder={t('common.form.name', {})}
            {...form.getInputProps('name')}
          />

          <TagsInput
            label={t('pages.server.backups.modal.createBackup.form.ignoredFiles', {})}
            placeholder={t('pages.server.backups.modal.createBackup.form.ignoredFiles', {})}
            {...form.getInputProps('ignoredFiles')}
          />

          <Group>
            <Button type='submit' loading={loading} disabled={!form.isValid()}>
              {t('common.button.create', {})}
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
