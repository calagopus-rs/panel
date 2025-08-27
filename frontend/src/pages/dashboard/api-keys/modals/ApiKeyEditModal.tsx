import { httpErrorToHuman } from '@/api/axios';
import updateApiKey from '@/api/me/api-keys/updateApiKey';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';

type Props = ModalProps & {
  apiKey: UserApiKey;
};

export default ({ apiKey, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { updateApiKey: updateStateApiKey } = useUserStore();

  const [name, setName] = useState(apiKey.name);
  const [loading, setLoading] = useState(false);

  const doUpdate = () => {
    load(true, setLoading);

    updateApiKey(apiKey.uuid, name)
      .then(() => {
        updateStateApiKey(apiKey.uuid, { name });

        onClose();
        addToast('API Key updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'Edit API Key'} onClose={onClose} opened={opened}>
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
