import { httpErrorToHuman } from '@/api/axios';
import createSecurityKey from '@/api/me/security-keys/createSecurityKey';
import deleteSecurityKey from '@/api/me/security-keys/deleteSecurityKey';
import postSecurityKeyChallenge from '@/api/me/security-keys/postSecurityKeyChallenge';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { Group, ModalProps } from '@mantine/core';
import { useState } from 'react';

export default ({ opened, onClose }: ModalProps) => {
  const { addToast } = useToast();
  const { addSecurityKey } = useUserStore();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const doCreate = () => {
    load(true, setLoading);

    createSecurityKey(name)
      .then(([key, options]) => {
        window.navigator.credentials
          .create(options)
          .then((credential) => {
            postSecurityKeyChallenge(key.uuid, credential as PublicKeyCredential)
              .then(() => {
                addSecurityKey(key);
                onClose();
              })
              .catch((error) => {
                console.error(error);
                addToast(httpErrorToHuman(error), 'error');
                deleteSecurityKey(key.uuid);
              });
          })
          .catch((error) => {
            console.error(error);
            addToast('Passkey add operation was aborted.', 'error');
            deleteSecurityKey(key.uuid);
          });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <Modal title={'Create Security Key'} onClose={onClose} opened={opened}>
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
    </Modal>
  );
};
