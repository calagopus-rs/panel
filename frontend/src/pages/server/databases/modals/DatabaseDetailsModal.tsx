import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import rotateDatabasePassword from '@/api/server/databases/rotateDatabasePassword.ts';
import Button from '@/elements/Button.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

type Props = ModalProps & {
  database: ServerDatabase;
};

export default function DatabaseDetailsModal({ database, opened, onClose }: Props) {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { server, databases, setDatabases } = useServerStore();
  const [loading, setLoading] = useState(false);

  const host = `${database.host}:${database.port}`;
  const jdbcConnectionString = `jdbc:${database.type}://${database.username}${
    database.password ? `:${encodeURIComponent(database.password)}` : ''
  }@${host}/${database.name}`;

  const onRotatePassword = () => {
    setLoading(true);

    rotateDatabasePassword(server.uuid, database.uuid)
      .then((password) => {
        addToast(t('pages.server.databases.modal.databaseDetails.toast.passwordRotated', {}), 'success');
        setDatabases({
          ...databases,
          data: databases.data.map((db) => (db.uuid === database.uuid ? { ...db, password } : db)),
        });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={t('pages.server.databases.modal.databaseDetails.title', {})} onClose={onClose} opened={opened}>
      <Stack>
        <TextInput
          label={t('pages.server.databases.modal.createDatabase.form.databaseName', {})}
          placeholder={t('pages.server.databases.modal.createDatabase.form.databaseName', {})}
          value={database.name}
          readOnly
        />
        <TextInput label={t('common.form.host', {})} placeholder={t('common.form.host', {})} value={host} readOnly />
        <TextInput
          label={t('common.form.username', {})}
          placeholder={t('common.form.username', {})}
          value={database.username}
          readOnly
        />
        <TextInput
          label={t('common.form.password', {})}
          placeholder={t('common.form.password', {})}
          value={database.password ?? ''}
          readOnly
        />
        <TextInput
          label={t('pages.server.databases.modal.databaseDetails.form.jdbcConnectionString', {})}
          placeholder={t('pages.server.databases.modal.databaseDetails.form.jdbcConnectionString', {})}
          value={jdbcConnectionString}
          readOnly
        />

        <Group>
          <Button color='red' onClick={onRotatePassword} loading={loading} disabled={database.isLocked}>
            {t('pages.server.databases.button.rotatePassword', {})}
          </Button>
          <Button variant='default' onClick={onClose}>
            {t('common.button.close', {})}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
