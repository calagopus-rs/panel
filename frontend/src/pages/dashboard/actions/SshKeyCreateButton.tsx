import { httpErrorToHuman } from '@/api/axios';
import createSshKey from '@/api/me/ssh-keys/createSshKey';
import Button from '@/elements/Button';
import TextArea from '@/elements/input/TextArea';
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
  const { addSshKey } = useUserStore();

  const [openModal, setOpenModal] = useState<'create'>(null);

  const [name, setName] = useState('');
  const [pubKey, setPubKey] = useState('');

  useEffect(() => {
    if (!openModal) {
      setName('');
      setPubKey('');
      return;
    }
  }, [openModal]);

  const doCreate = () => {
    createSshKey(name, pubKey)
      .then((key) => {
        addToast('SSH key created.', 'success');
        setOpenModal(null);
        addSshKey(key);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Modal title={'Create SSH Key'} opened={openModal === 'create'} onClose={() => setOpenModal(null)}>
        <TextInput label={'Name'} placeholder={'Name'} value={name} onChange={(e) => setName(e.target.value)} />

        <TextArea
          label={'Public Key'}
          placeholder={'Public Key'}
          value={pubKey}
          onChange={(e) => setPubKey(e.target.value)}
          rows={3}
          resize={'none'}
          mt={'sm'}
        />

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
