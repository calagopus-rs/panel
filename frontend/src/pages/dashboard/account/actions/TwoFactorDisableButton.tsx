import { Group, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod/v4';
import { httpErrorToHuman } from '@/api/axios';
import disableTwoFactor from '@/api/me/account/disableTwoFactor';
import Button from '@/elements/Button';
import PasswordInput from '@/elements/input/PasswordInput';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

const schema = z.object({
  code: z.string().min(6).max(10),
  password: z.string().max(512),
});

export default function TwoFactorDisableButton() {
  const { addToast } = useToast();
  const { user, setUser } = useAuth();

  const [openModal, setOpenModal] = useState<'disable'>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      code: '',
      password: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      return;
    }
  }, [open]);

  const doDisable = () => {
    setLoading(true);

    disableTwoFactor(form.values)
      .then(() => {
        addToast('Two-factor authentication disabled.', 'success');
        setOpenModal(null);
        setUser({ ...user!, totpEnabled: false });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Modal title='Disable Two-Step Verification' onClose={() => setOpenModal(null)} opened={openModal === 'disable'}>
        <Stack>
          <Text>Disabling two-step verification will make your account less secure.</Text>

          <TextInput withAsterisk label='Code' placeholder='000000' {...form.getInputProps('code')} />

          <PasswordInput withAsterisk label='Password' placeholder='Password' {...form.getInputProps('password')} />

          <Group>
            <Button color='red' onClick={doDisable} loading={loading} disabled={!form.isValid()}>
              Disable
            </Button>
            <Button variant='default' onClick={() => setOpenModal(null)}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Button color='red' onClick={() => setOpenModal('disable')}>
        Disable Two-Step
      </Button>
    </>
  );
}
