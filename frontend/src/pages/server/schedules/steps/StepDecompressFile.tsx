import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { Stack } from '@mantine/core';
import { useEffect } from 'react';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionDecompressFile;
  setAction: (action: ScheduleActionDecompressFile) => void;
}) => {
  useEffect(() => {
    if (!action.root) {
      setAction({ ...action, root: '/' });
    }
    if (!action.file) {
      setAction({ ...action, file: 'backup.tar.gz' });
    }
    if (!action.ignoreFailure) {
      setAction({ ...action, ignoreFailure: false });
    }
    if (!action.foreground) {
      setAction({ ...action, foreground: false });
    }
  }, [action, setAction]);

  return (
    <Stack>
      <TextInput
        label={'Root Path'}
        placeholder={'/'}
        value={action.root}
        onChange={(e) => setAction({ ...action, root: e.currentTarget.value })}
      />
      <TextInput
        label={'File'}
        placeholder={'backup.tar.gz'}
        value={action.file}
        onChange={(e) => setAction({ ...action, file: e.currentTarget.value })}
      />
      <Switch
        label={'Run in Foreground'}
        checked={action.foreground}
        onChange={(e) => setAction({ ...action, foreground: e.currentTarget.checked })}
      />
      <Switch
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.currentTarget.checked })}
      />
    </Stack>
  );
};
