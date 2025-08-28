import { httpErrorToHuman } from '@/api/axios';
import updateSecurityKey from '@/api/me/security-keys/updateSecurityKey';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';

type Props = ModalProps & {
  securityKey: UserSecurityKey;
};

export default ({ securityKey, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { updateSecurityKey: updateStateSecurityKey } = useUserStore();

  const [name, setName] = useState(securityKey.name);
  const [loading, setLoading] = useState(false);

  const doUpdate = () => {
    load(true, setLoading);

    updateSecurityKey(securityKey.uuid, name)
      .then(() => {
        updateStateSecurityKey(securityKey.uuid, { name });

        onClose();
        addToast('Security Key updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'Edit Security Key'} onClose={onClose} opened={opened}>
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
};
