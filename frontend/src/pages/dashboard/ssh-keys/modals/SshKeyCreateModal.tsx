import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import createSshKey from '@/api/me/ssh-keys/createSshKey';
import Button from '@/elements/Button';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';

export default function SshKeyCreateModal({ opened, onClose }: ModalProps) {
  const { addToast } = useToast();
  const { addSshKey } = useUserStore();

  const [name, setName] = useState('');
  const [pubKey, setPubKey] = useState('');
  const [loading, setLoading] = useState(false);

  const doCreate = () => {
    load(true, setLoading);

    createSshKey(name, pubKey)
      .then((key) => {
        addToast('SSH key created.', 'success');

        onClose();
        addSshKey(key);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <Modal title={'Create SSH Key'} onClose={onClose} opened={opened}>
      <Stack>
        <TextInput
          withAsterisk
          label={'Name'}
          placeholder={'Name'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <TextArea
          withAsterisk
          label={'Public Key'}
          placeholder={'Public Key'}
          value={pubKey}
          onChange={(e) => setPubKey(e.target.value)}
          rows={3}
          resize={'none'}
        />

        <Group mt={'md'}>
          <Button onClick={doCreate} loading={loading} disabled={!name || !pubKey}>
            Create
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
