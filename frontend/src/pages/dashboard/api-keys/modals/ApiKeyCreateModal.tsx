import { httpErrorToHuman } from '@/api/axios';
import createApiKey from '@/api/me/api-keys/createApiKey';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';

export default ({ opened, onClose }: ModalProps) => {
  const { addToast } = useToast();
  const { addApiKey } = useUserStore();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const doCreate = () => {
    load(true, setLoading);

    createApiKey(name)
      .then((key) => {
        addToast('API key created.', 'success');

        onClose();
        addApiKey({ ...key.apiKey, keyStart: key.key });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <Modal title={'Create API Key'} onClose={onClose} opened={opened}>
      <Stack>
        <TextInput
          withAsterisk
          label={'Name'}
          placeholder={'Name'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Group mt={'md'}>
          <Button onClick={doCreate} loading={loading} disabled={!name}>
            Create
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
