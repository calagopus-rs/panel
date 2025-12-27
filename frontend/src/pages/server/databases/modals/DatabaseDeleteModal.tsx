import { Group, ModalProps, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import deleteDatabase from '@/api/server/databases/deleteDatabase.ts';
import Button from '@/elements/Button.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

type Props = ModalProps & {
  database: ServerDatabase;
};

export default function DatabaseDeleteModal({ database, opened, onClose }: Props) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);
  const { removeDatabase } = useServerStore();

  const [enteredName, setEnteredName] = useState('');
  const [loading, setLoading] = useState(false);

  const doDelete = () => {
    setLoading(true);

    deleteDatabase(server.uuid, database.uuid)
      .then(() => {
        addToast(t('pages.server.databases.modal.deleteDatabase.toast.deleted', {}), 'success');
        onClose();
        removeDatabase(database);
      })
      .catch((error) => {
        console.error(error);
        addToast(httpErrorToHuman(error), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={t('pages.server.databases.modal.deleteDatabase.title', {})} onClose={onClose} opened={opened}>
      <Stack>
        <Text>{t('pages.server.databases.modal.deleteDatabase.content', { name: database.name }).md()}</Text>

        <TextInput
          withAsterisk
          label={t('pages.server.databases.modal.createDatabase.form.databaseName', {})}
          placeholder={t('pages.server.databases.modal.createDatabase.form.databaseName', {})}
          value={enteredName}
          onChange={(e) => setEnteredName(e.target.value)}
        />

        <Group>
          <Button color='red' onClick={doDelete} loading={loading} disabled={database.name !== enteredName}>
            {t('common.button.delete', {})}
          </Button>
          <Button variant='default' onClick={onClose}>
            {t('common.button.close', {})}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
