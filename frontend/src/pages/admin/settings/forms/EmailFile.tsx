import { Group, Stack } from '@mantine/core';
import { Dispatch, SetStateAction, useEffect } from 'react';
import TextInput from '@/elements/input/TextInput';

export default function EmailFile({
  settings,
  setSettings,
}: {
  settings: MailModeFilesystem;
  setSettings: Dispatch<SetStateAction<MailMode>>;
}) {
  useEffect(() => {
    setSettings((settings: MailModeFilesystem) => ({
      ...settings,
      path: settings.path || '',
      fromAddress: settings.fromAddress || '',
      fromName: settings.fromName || '',
    }));
  }, []);

  return (
    <Stack mt={'md'}>
      <TextInput
        withAsterisk
        label={'Path'}
        placeholder={'Path'}
        value={settings.path || ''}
        onChange={(e) => setSettings((settings) => ({ ...settings, path: e.target.value }))}
      />

      <Group grow>
        <TextInput
          withAsterisk
          label={'From Address'}
          placeholder={'From Address'}
          value={settings.fromAddress || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, fromAddress: e.target.value }))}
        />
        <TextInput
          label={'From Name'}
          placeholder={'From Name'}
          value={settings.fromName || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, fromName: e.target.value }))}
        />
      </Group>
    </Stack>
  );
}
