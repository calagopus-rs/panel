import { httpErrorToHuman } from '@/api/axios';
import createApiKey from '@/api/me/api-keys/createApiKey';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useUserStore } from '@/stores/user';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group } from '@mantine/core';
import { useEffect, useState } from 'react';

export default () => {
  const { addToast } = useToast();
  const { addApiKey } = useUserStore();

  const [openModal, setOpenModal] = useState<'create'>(null);

  const [name, setName] = useState('');

  useEffect(() => {
    if (!openModal) {
      setName('');
      return;
    }
  }, [openModal]);

  const doCreate = () => {
    createApiKey(name)
      .then((key) => {
        addToast('API key created.', 'success');
        setOpenModal(null);
        addApiKey({ ...key.apiKey, keyStart: key.key });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Modal title={'Create API Key'} opened={openModal === 'create'} onClose={() => setOpenModal(null)}>
        <TextInput label={'Name'} placeholder={'Name'} value={name} onChange={(e) => setName(e.target.value)} />

        <Group mt={'md'}>
          <Button onClick={doCreate} disabled={!name}>
            Create
          </Button>
          <Button variant={'default'} onClick={() => setOpenModal(null)}>
            Close
          </Button>
        </Group>
      </Modal>

      <Button onClick={() => setOpenModal('create')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
        Create
      </Button>
    </>
  );
};
