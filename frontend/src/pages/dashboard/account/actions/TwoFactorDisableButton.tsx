import { Group, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import disableTwoFactor from '@/api/me/account/disableTwoFactor.ts';
import Button from '@/elements/Button.tsx';
import PasswordInput from '@/elements/input/PasswordInput.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { dashboardTwoFactorDisableSchema } from '@/lib/schemas/dashboard.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';

export default function TwoFactorDisableButton() {
  const { addToast } = useToast();
  const { user, setUser } = useAuth();

  const [openModal, setOpenModal] = useState<'disable' | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof dashboardTwoFactorDisableSchema>>({
    initialValues: {
      code: '',
      password: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(dashboardTwoFactorDisableSchema),
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

          <TextInput
            withAsterisk
            label='Code'
            placeholder='000000'
            autoComplete='one-time-code'
            {...form.getInputProps('code')}
          />

          <PasswordInput
            withAsterisk
            label='Password'
            placeholder='Password'
            autoComplete='current-password'
            {...form.getInputProps('password')}
          />

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
