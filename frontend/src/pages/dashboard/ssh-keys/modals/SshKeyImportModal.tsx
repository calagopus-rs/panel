import { httpErrorToHuman } from '@/api/axios';
import importSshKeys from '@/api/me/ssh-keys/importSshKeys';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { sshKeyProviderLabelMapping } from '@/lib/enums';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';

export default ({ opened, onClose }: ModalProps) => {
  const { addToast } = useToast();
  const { addSshKey } = useUserStore();

  const [provider, setProvider] = useState<SshKeyProvider>('github');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const doImport = () => {
    load(true, setLoading);

    importSshKeys(provider, username)
      .then((keys) => {
        addToast(`${keys.length} SSH key${keys.length === 1 ? '' : 's'} created.`, 'success');

        onClose();
        for (const key of keys) {
          addSshKey(key);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <Modal title={'Import SSH Keys'} onClose={onClose} opened={opened}>
      <Stack>
        <Select
          withAsterisk
          label={'Provider'}
          data={Object.entries(sshKeyProviderLabelMapping).map(([value, label]) => ({
            label,
            value,
          }))}
          value={provider}
          onChange={(value) => setProvider(value as SshKeyProvider)}
        />

        <TextInput
          withAsterisk
          label={'Username'}
          placeholder={'Username'}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <Group mt={'md'}>
          <Button onClick={doImport} loading={loading} disabled={!username}>
            Import
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
