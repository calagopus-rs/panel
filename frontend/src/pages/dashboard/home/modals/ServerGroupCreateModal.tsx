import { Group, ModalProps } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import createServerGroup from '@/api/me/servers/groups/createServerGroup';

export default function ServerGroupCreateModal({ opened, onClose }: ModalProps) {
  const { addToast } = useToast();
  const { addServerGroup } = useUserStore();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const doCreate = () => {
    setLoading(true);

    createServerGroup(name, [])
      .then((serverGroup) => {
        addServerGroup(serverGroup);
        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Create Server Group' onClose={onClose} opened={opened}>
      <TextInput
        withAsterisk
        label='Name'
        placeholder='Name'
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Group mt='md'>
        <Button onClick={doCreate} loading={loading} disabled={!name}>
          Create
        </Button>
        <Button variant='default' onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
}
