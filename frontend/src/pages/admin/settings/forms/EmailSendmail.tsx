import { Group, Stack } from '@mantine/core';
import { Dispatch, SetStateAction, useEffect } from 'react';
import TextInput from '@/elements/input/TextInput';

export default function EmailSendmail({
  settings,
  setSettings,
}: {
  settings: MailModeSendmail;
  setSettings: Dispatch<SetStateAction<MailMode>>;
}) {
  useEffect(() => {
    setSettings((settings: MailModeSendmail) => ({
      ...settings,
      command: settings.command || 'sendmail',
      fromAddress: settings.fromAddress || '',
      fromName: settings.fromName || '',
    }));
  }, []);

  return (
    <Stack mt='md'>
      <TextInput
        label='Command'
        placeholder='Command'
        value={settings.command || 'sendmail'}
        onChange={(e) => setSettings((settings) => ({ ...settings, command: e.target.value }))}
      />

      <Group grow>
        <TextInput
          withAsterisk
          label='From Address'
          placeholder='From Address'
          value={settings.fromAddress || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, fromAddress: e.target.value }))}
        />
        <TextInput
          label='From Name'
          placeholder='From Name'
          value={settings.fromName || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, fromName: e.target.value }))}
        />
      </Group>
    </Stack>
  );
}
