import NumberInput from '@/elements/input/NumberInput';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { Group, Stack } from '@mantine/core';
import { Dispatch, SetStateAction } from 'react';

export default ({
  settings,
  setSettings,
}: {
  settings: MailModeSmtp;
  setSettings: Dispatch<SetStateAction<MailMode>>;
}) => {
  return (
    <Stack mt={'md'}>
      <Group grow>
        <TextInput
          withAsterisk
          label={'Host'}
          placeholder={'Host'}
          value={settings.host || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, host: e.target.value }))}
        />
        <NumberInput
          withAsterisk
          label={'Port'}
          placeholder={'Port'}
          min={0}
          value={settings.port || 543}
          onChange={(e) => setSettings((settings) => ({ ...settings, port: Number(e) }))}
        />
      </Group>

      <Switch
        label={'Use TLS'}
        checked={settings.useTls}
        onChange={(e) => setSettings((settings) => ({ ...settings, useTls: e.target.checked }))}
      />

      <Group grow>
        <TextInput
          label={'Username'}
          placeholder={'Username'}
          value={settings.username || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, username: e.target.value }))}
        />
        <TextInput
          label={'Password'}
          placeholder={'Password'}
          type={'password'}
          value={settings.password || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, password: e.target.value }))}
        />
      </Group>

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
};
