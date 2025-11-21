import { Group, ModalProps } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { httpErrorToHuman } from '@/api/axios';
import installServer from '@/api/server/settings/installServer';
import Button from '@/elements/Button';
import Switch from '@/elements/input/Switch';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

export default function SettingsReinstallModal({ opened, onClose }: ModalProps) {
  const { addToast } = useToast();
  const { server, updateServer } = useServerStore();
  const navigate = useNavigate();

  const [truncate, setTruncate] = useState(false);
  const [loading, setLoading] = useState(false);

  const doReinstall = () => {
    setLoading(true);

    installServer(server.uuid, { truncateDirectory: truncate })
      .then(() => {
        addToast('Reinstalling server...', 'success');

        navigate(`/server/${server.uuidShort}`);
        updateServer({ status: 'installing' });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Reinstall Server' onClose={onClose} opened={opened}>
      <Switch
        label='Do you want to empty the filesystem of this server before reinstallation?'
        name='truncate'
        defaultChecked={truncate}
        onChange={(e) => setTruncate(e.target.checked)}
      />

      <Group mt='md'>
        <Button color='red' onClick={doReinstall} loading={loading}>
          Reinstall
        </Button>
        <Button variant='default' onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
}
