import { httpErrorToHuman } from '@/api/axios';
import disableTwoFactor from '@/api/me/account/disableTwoFactor';
import Button from '@/elements/Button';
import NumberInput from '@/elements/input/NumberInput';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Group } from '@mantine/core';
import { useEffect, useState } from 'react';

export default () => {
  const { addToast } = useToast();
  const { user, setUser } = useAuth();

  const [openModal, setOpenModal] = useState<'disable'>(null);

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!open) {
      setCode('');
      setPassword('');
      return;
    }
  }, [open]);

  const doDisable = () => {
    disableTwoFactor(code, password)
      .then(() => {
        addToast('Two-factor authentication disabled.', 'success');
        setOpenModal(null);
        setUser({ ...user!, totpEnabled: false });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Modal
        title={'Disable Two-Step Verification'}
        onClose={() => setOpenModal(null)}
        opened={openModal === 'disable'}
      >
        <p>Disabling two-step verification will make your account less secure.</p>

        <NumberInput
          label={'Code'}
          placeholder={'000000'}
          value={code}
          onChange={(value) => setCode(String(value))}
          mt={'sm'}
        />

        <TextInput
          label={'Password'}
          placeholder={'Password'}
          type={'password'}
          onChange={(e) => setPassword(e.target.value)}
          mt={'sm'}
        />

        <Group mt={'md'}>
          <Button variant={'default'} onClick={() => setOpenModal(null)}>
            Close
          </Button>

          <Button color={'red'} onClick={doDisable} disabled={!password}>
            Disable
          </Button>
        </Group>
      </Modal>

      <Button color={'red'} onClick={() => setOpenModal('disable')}>
        Disable Two-Step
      </Button>
    </>
  );
};
