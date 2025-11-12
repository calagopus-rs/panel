import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import deleteServer from '@/api/admin/servers/deleteServer';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';

export default function ServerDeleteModal({ server, opened, onClose }: ModalProps & { server: AdminServer }) {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [deleteDoForce, setDeleteDoForce] = useState(false);
  const [deleteDoDeleteBackups, setDeleteDoDeleteBackups] = useState(false);
  const [deleteServerName, setDeleteServerName] = useState('');

  const doDelete = () => {
    setLoading(true);
    deleteServer(server.uuid, {
      force: deleteDoForce,
      deleteBackups: deleteDoDeleteBackups,
    })
      .then(() => {
        addToast('Server deleted.', 'success');
        onClose();
        navigate('/admin/servers');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Modal title={'Confirm Server Deletion'} onClose={onClose} opened={opened}>
        <Stack>
          <Switch
            label={'Do you want to forcefully delete this server?'}
            name={'force'}
            defaultChecked={deleteDoForce}
            onChange={(e) => setDeleteDoForce(e.target.checked)}
          />

          <Switch
            label={'Do you want to delete backups of this server?'}
            name={'deleteBackups'}
            defaultChecked={deleteDoDeleteBackups}
            onChange={(e) => setDeleteDoDeleteBackups(e.target.checked)}
          />

          <TextInput
            withAsterisk
            label={'Confirm Server Name'}
            placeholder={'Server Name'}
            value={deleteServerName}
            onChange={(e) => setDeleteServerName(e.target.value)}
          />
        </Stack>

        <Group mt={'md'}>
          <Button color={'red'} disabled={server.name != deleteServerName} loading={loading} onClick={doDelete}>
            Okay
          </Button>
          <Button variant={'default'} onClick={() => onClose()}>
            Cancel
          </Button>
        </Group>
      </Modal>
    </>
  );
}
