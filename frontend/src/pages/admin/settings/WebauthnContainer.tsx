import { Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';
import updateWebauthnSettings from '@/api/admin/settings/updateWebauthnSettings';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import { load } from '@/lib/debounce';
import { isIP } from '@/lib/ip';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';

export default function WebauthnContainer() {
  const { addToast } = useToast();
  const { webauthn } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [webauthnSettings, setWebauthnSettings] = useState<AdminSettings['webauthn']>(webauthn);

  const doUpdate = () => {
    load(true, setLoading);
    updateWebauthnSettings(webauthnSettings)
      .then(() => {
        addToast('Webauthn settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  const doAutofill = () => {
    if (isIP(window.location.hostname)) {
      addToast('Cannot use Webauthn on an IP Address', 'error');
      return;
    }

    setWebauthnSettings({
      rpId: window.location.hostname.split('.').slice(-2).join('.'),
      rpOrigin: window.location.origin,
    });
  };

  return (
    <>
      <Title mt={'md'} order={2}>
        Webauthn Settings
      </Title>

      <Stack>
        <Group grow>
          <TextInput
            withAsterisk
            label={'RP Id'}
            placeholder={'RP Id'}
            value={webauthnSettings.rpId || ''}
            onChange={(e) => setWebauthnSettings({ ...webauthnSettings, rpId: e.target.value })}
          />
          <TextInput
            withAsterisk
            label={'RP Origin'}
            placeholder={'RP Origin'}
            value={webauthnSettings.rpOrigin || ''}
            onChange={(e) => setWebauthnSettings({ ...webauthnSettings, rpOrigin: e.target.value })}
          />
        </Group>
      </Stack>

      <Group mt={'md'}>
        <Button onClick={doUpdate} loading={loading}>
          Save
        </Button>
        <Button variant={'outline'} onClick={doAutofill} disabled={loading}>
          Autofill
        </Button>
      </Group>
    </>
  );
}
