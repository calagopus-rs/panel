import { httpErrorToHuman } from '@/api/axios';
import restoreBackup from '@/api/server/backups/restoreBackup';
import Button from '@/elements/Button';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps, Switch } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router';

type Props = ModalProps & {
  backup: ServerBackup;
};

export default ({ backup, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { server } = useServerStore();
  const navigate = useNavigate();

  const [truncate, setTruncate] = useState(false);
  const [loading, setLoading] = useState(false);

  const doRestore = () => {
    load(true, setLoading);

    restoreBackup(server.uuid, backup.uuid, { truncateDirectory: truncate })
      .then(() => {
        onClose();
        addToast('Restoring backup...', 'success');

        navigate(`/server/${server.uuidShort}`);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'Restore Backup'} onClose={onClose} opened={opened}>
      <Switch
        label={'Do you want to empty the filesystem of this server before restoring the backup?'}
        name={'truncate'}
        checked={truncate}
        onChange={(e) => setTruncate(e.target.checked)}
      />

      <Group mt={'md'}>
        <Button color={truncate ? 'red' : undefined} onClick={doRestore} loading={loading}>
          Restore
        </Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
