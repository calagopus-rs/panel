import TextInput from '@/elements/input/TextInput';
import { Stack } from '@mantine/core';
import { Dispatch, SetStateAction } from 'react';

export default ({
  settings,
  setSettings,
}: {
  settings: StorageDriverFilesystem;
  setSettings: Dispatch<SetStateAction<StorageDriver>>;
}) => {
  return (
    <Stack mt={'md'}>
      <TextInput
        withAsterisk
        label={'Path'}
        placeholder={'Path'}
        value={settings.path || ''}
        onChange={(e) => setSettings((settings) => ({ ...settings, path: e.target.value }))}
      />
    </Stack>
  );
};
