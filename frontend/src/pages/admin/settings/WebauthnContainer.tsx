import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import updateWebauthnSettings from '@/api/admin/settings/updateWebauthnSettings.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { isIP } from '@/lib/ip.ts';
import { adminSettingsWebauthnSchema } from '@/lib/schemas/admin/settings.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';

export default function WebauthnContainer() {
  const { addToast } = useToast();
  const { webauthn } = useAdminStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof adminSettingsWebauthnSchema>>({
    initialValues: {
      rpId: '',
      rpOrigin: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminSettingsWebauthnSchema),
  });

  useEffect(() => {
    form.setValues({
      ...webauthn,
    });
  }, [webauthn]);

  const doUpdate = () => {
    setLoading(true);
    updateWebauthnSettings(form.values)
      .then(() => {
        addToast('Webauthn settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  const doAutofill = () => {
    if (isIP(window.location.hostname)) {
      addToast('Cannot use Webauthn on an IP Address', 'error');
      return;
    }

    form.setValues({
      rpId: window.location.hostname.split('.').slice(-2).join('.'),
      rpOrigin: window.location.origin,
    });
  };

  return (
    <AdminContentContainer title='Webauthn Settings'>
      <Title mt='md' order={2}>
        Webauthn Settings
      </Title>

      <form onSubmit={form.onSubmit(() => doUpdate())}>
        <Stack>
          <Group grow>
            <TextInput withAsterisk label='RP Id' placeholder='RP Id' {...form.getInputProps('rpId')} />
            <TextInput withAsterisk label='RP Origin' placeholder='RP Origin' {...form.getInputProps('rpOrigin')} />
          </Group>
        </Stack>

        <Group mt='md'>
          <Button type='submit' disabled={!form.isValid()} loading={loading}>
            Save
          </Button>
          <Button variant='outline' onClick={doAutofill} disabled={loading}>
            Autofill
          </Button>
        </Group>
      </form>
    </AdminContentContainer>
  );
}
