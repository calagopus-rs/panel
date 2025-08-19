import NumberInput from '@/elements/inputnew/NumberInput';
import Switch from '@/elements/inputnew/Switch';
import TextInput from '@/elements/inputnew/TextInput';
import { Group } from '@mantine/core';
import { Dispatch, SetStateAction } from 'react';

export default ({
  settings,
  setSettings,
}: {
  settings: MailModeSmtp;
  setSettings: Dispatch<SetStateAction<MailMode>>;
}) => {
  return (
    <>
      <Group grow>
        <TextInput
          label={'Host'}
          placeholder={'Host'}
          value={settings.host || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, host: e.target.value }))}
          mt={'sm'}
        />
        <NumberInput
          label={'Port'}
          placeholder={'Port'}
          min={0}
          value={settings.port || 543}
          onChange={(e) => setSettings((settings) => ({ ...settings, port: Number(e) }))}
          mt={'sm'}
        />
      </Group>

      <Switch
        label={'Use TLS'}
        checked={settings.useTls}
        onChange={(e) => setSettings((settings) => ({ ...settings, useTls: e.target.checked }))}
        mt={'sm'}
      />

      <Group grow>
        <TextInput
          label={'Username'}
          placeholder={'Username'}
          value={settings.username || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, username: e.target.value }))}
          mt={'sm'}
        />
        <TextInput
          label={'Password'}
          placeholder={'Password'}
          type={'password'}
          value={settings.password || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, password: e.target.value }))}
          mt={'sm'}
        />
      </Group>

      <Group grow>
        <TextInput
          label={'From Address'}
          placeholder={'From Address'}
          value={settings.fromAddress || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, fromAddress: e.target.value }))}
          mt={'sm'}
        />
        <TextInput
          label={'From Name'}
          placeholder={'From Name'}
          value={settings.fromName || ''}
          onChange={(e) => setSettings((settings) => ({ ...settings, fromName: e.target.value }))}
          mt={'sm'}
        />
      </Group>
    </>
  );
};
