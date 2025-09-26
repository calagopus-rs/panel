import NumberInput from '@/elements/input/NumberInput';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { Group, Stack } from '@mantine/core';
import { Dispatch, SetStateAction } from 'react';

export default ({
  settings,
  setSettings,
}: {
  settings: StorageDriverS3;
  setSettings: Dispatch<SetStateAction<StorageDriver>>;
}) => {
  return (
    <Stack mt={'md'}>
      <Group grow>
        <TextInput
          withAsterisk
          label={'Access Key'}
          placeholder={'Access Key'}
          value={settings.accessKey || ''}
          onChange={(e) => setSettings({ ...settings, accessKey: e.target.value })}
        />
        <TextInput
          withAsterisk
          label={'Secret Key'}
          placeholder={'Secret Key'}
          type={'password'}
          value={settings.secretKey || ''}
          onChange={(e) => setSettings({ ...settings, secretKey: e.target.value })}
        />
      </Group>

      <Group grow>
        <TextInput
          withAsterisk
          label={'Bucket'}
          placeholder={'Bucket'}
          value={settings.bucket || ''}
          onChange={(e) => setSettings({ ...settings, bucket: e.target.value })}
        />
        <TextInput
          withAsterisk
          label={'Region'}
          placeholder={'Region'}
          value={settings.region || ''}
          onChange={(e) => setSettings({ ...settings, region: e.target.value })}
        />
      </Group>

      <TextInput
        withAsterisk
        label={'Endpoint'}
        placeholder={'Endpoint'}
        value={settings.endpoint || ''}
        onChange={(e) => setSettings({ ...settings, endpoint: e.target.value })}
      />

      <Switch
        label={settings.pathStyle ? 'Using path-style URLs' : 'Using virtual-hosted-style URLs'}
        checked={settings.pathStyle || false}
        onChange={(e) => setSettings({ ...settings, pathStyle: e.currentTarget.checked })}
      />
    </Stack>
  );
};
