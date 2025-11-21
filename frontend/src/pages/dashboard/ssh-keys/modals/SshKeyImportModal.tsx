import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import importSshKeys from '@/api/me/ssh-keys/importSshKeys';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { sshKeyProviderLabelMapping } from '@/lib/enums';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';

export default function SshKeyImportModal({ opened, onClose }: ModalProps) {
  const { addToast } = useToast();
  const { addSshKey } = useUserStore();

  const [provider, setProvider] = useState<SshKeyProvider>('github');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const doImport = () => {
    setLoading(true);

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
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Import SSH Keys' onClose={onClose} opened={opened}>
      <Stack>
        <div className='grid grid-cols-3 gap-2'>
          <Select
            withAsterisk
            label='Provider'
            data={Object.entries(sshKeyProviderLabelMapping).map(([value, label]) => ({
              label,
              value,
            }))}
            value={provider}
            onChange={(value) => setProvider(value as SshKeyProvider)}
          />

          <TextInput
            withAsterisk
            label='Username'
            placeholder='Username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className='col-span-2'
          />
        </div>

        <Group mt='md'>
          <Button onClick={doImport} loading={loading} disabled={!username}>
            Import
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
