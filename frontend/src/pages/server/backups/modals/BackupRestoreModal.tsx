import { Group, ModalProps, Switch } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { httpErrorToHuman } from '@/api/axios.ts';
import restoreBackup from '@/api/server/backups/restoreBackup.ts';
import Button from '@/elements/Button.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

type Props = ModalProps & {
  backup: ServerBackup;
};

export default function BackupRestoreModal({ backup, opened, onClose }: Props) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { server, updateServer } = useServerStore();
  const navigate = useNavigate();

  const [truncate, setTruncate] = useState(false);
  const [loading, setLoading] = useState(false);

  const doRestore = () => {
    setLoading(true);

    restoreBackup(server.uuid, backup.uuid, { truncateDirectory: truncate })
      .then(() => {
        onClose();
        addToast(t('pages.server.backups.toast.restoringBackup', {}), 'success');

        navigate(`/server/${server.uuidShort}`);
        updateServer({ status: 'restoring_backup' });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={t('pages.server.backups.modal.restoreBackup.title', {})} onClose={onClose} opened={opened}>
      <Switch
        label={t('common.form.truncateDirectory', {})}
        name='truncate'
        checked={truncate}
        onChange={(e) => setTruncate(e.target.checked)}
      />

      <Group mt='md'>
        <Button color={truncate ? 'red' : undefined} onClick={doRestore} loading={loading}>
          {t('pages.server.backups.button.restore', {})}
        </Button>
        <Button variant='default' onClick={onClose}>
          {t('common.button.close', {})}
        </Button>
      </Group>
    </Modal>
  );
}
