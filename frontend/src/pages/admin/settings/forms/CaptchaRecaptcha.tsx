import { Group, Stack } from '@mantine/core';
import { Dispatch, SetStateAction, useEffect } from 'react';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';

export default function CaptchaRecaptcha({
  settings,
  setSettings,
}: {
  settings: CaptchaProviderRecaptcha;
  setSettings: Dispatch<SetStateAction<CaptchaProviderRecaptcha>>;
}) {
  useEffect(() => {
    setSettings((settings: CaptchaProviderRecaptcha) => ({
      ...settings,
      siteKey: settings.siteKey || '',
      secretKey: settings.secretKey || '',
      v3: settings.v3 ?? false,
    }));
  }, []);

  return (
    <Stack mt='md'>
      <Group grow>
        <TextInput
          withAsterisk
          label='Site Key'
          placeholder='Site Key'
          value={settings.siteKey || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, siteKey: e.target.value }))}
        />
        <TextInput
          withAsterisk
          label='Secret Key'
          placeholder='Secret Key'
          type='password'
          value={settings.secretKey || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, secretKey: e.target.value }))}
        />
      </Group>

      <Switch
        label='V3'
        checked={settings.v3}
        onChange={(e) => setSettings((settings) => ({ ...settings, v3: e.target.checked }))}
      />
    </Stack>
  );
}
