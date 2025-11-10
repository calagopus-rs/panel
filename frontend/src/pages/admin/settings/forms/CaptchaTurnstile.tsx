import { Group, Stack } from '@mantine/core';
import { Dispatch, SetStateAction, useEffect } from 'react';
import TextInput from '@/elements/input/TextInput';

export default function CaptchaTurnstile({
  settings,
  setSettings,
}: {
  settings: CaptchaProviderTurnstile;
  setSettings: Dispatch<SetStateAction<CaptchaProviderTurnstile>>;
}) {
  useEffect(() => {
    setSettings((settings: CaptchaProviderTurnstile) => ({
      ...settings,
      siteKey: settings.siteKey || '',
      secretKey: settings.secretKey || '',
    }));
  }, []);

  return (
    <Stack mt={'md'}>
      <Group grow>
        <TextInput
          withAsterisk
          label={'Site Key'}
          placeholder={'Site Key'}
          value={settings.siteKey || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, siteKey: e.target.value }))}
        />
        <TextInput
          withAsterisk
          label={'Secret Key'}
          placeholder={'Secret Key'}
          type={'password'}
          value={settings.secretKey || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, secretKey: e.target.value }))}
        />
      </Group>
    </Stack>
  );
}
