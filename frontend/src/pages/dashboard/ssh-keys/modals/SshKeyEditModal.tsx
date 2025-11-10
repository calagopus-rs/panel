import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import updateSshKey from '@/api/me/ssh-keys/updateSshKey';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';

type Props = ModalProps & {
  sshKey: UserSshKey;
};

export default function SshKeyEditModal({ sshKey, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { updateSshKey: updateStateSshKey } = useUserStore();

  const [name, setName] = useState(sshKey.name);
  const [loading, setLoading] = useState(false);

  const doUpdate = () => {
    load(true, setLoading);

    updateSshKey(sshKey.uuid, name)
      .then(() => {
        updateStateSshKey(sshKey.uuid, { name });

        onClose();
        addToast('SSH Key updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'Edit SSH Key'} onClose={onClose} opened={opened}>
      <Stack>
        <TextInput
          withAsterisk
          label={'Name'}
          placeholder={'Name'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Group>
          <Button onClick={doUpdate} loading={loading} disabled={!name}>
            Edit
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
