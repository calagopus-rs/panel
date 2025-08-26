import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { Group, Stack } from '@mantine/core';
import { Dispatch, SetStateAction } from 'react';

export default ({
  settings,
  setSettings,
}: {
  settings: CaptchaProviderRecaptcha;
  setSettings: Dispatch<SetStateAction<CaptchaProviderRecaptcha>>;
}) => {
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

      <Switch
        label={'V3'}
        checked={settings.v3}
        onChange={(e) => setSettings((settings) => ({ ...settings, v3: e.currentTarget.checked }))}
      />
    </Stack>
  );
};
