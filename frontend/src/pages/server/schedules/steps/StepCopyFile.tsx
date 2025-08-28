import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { Stack } from '@mantine/core';
import { useEffect } from 'react';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionCopyFile;
  setAction: (action: ScheduleActionCopyFile) => void;
}) => {
  useEffect(() => {
    if (!action.file) {
      setAction({ ...action, file: '/source.txt' });
    }
    if (!action.destination) {
      setAction({ ...action, destination: '/backup/target.txt' });
    }
    if (!action.foreground) {
      setAction({ ...action, foreground: false });
    }
    if (!action.ignoreFailure) {
      setAction({ ...action, ignoreFailure: false });
    }
  }, [action, setAction]);

  return (
    <Stack>
      <TextInput
        label={'Source File'}
        placeholder={'/source.txt'}
        value={action.file}
        onChange={(e) => setAction({ ...action, file: e.currentTarget.value })}
      />
      <TextInput
        label={'Destination'}
        placeholder={'/backup/target.txt'}
        value={action.destination}
        onChange={(e) => setAction({ ...action, destination: e.currentTarget.value })}
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
