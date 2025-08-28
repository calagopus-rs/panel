import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { Stack } from '@mantine/core';
import { useEffect } from 'react';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionCreateDirectory;
  setAction: (action: ScheduleActionCreateDirectory) => void;
}) => {
  useEffect(() => {
    if (!action.root) {
      setAction({ ...action, root: '/' });
    }
    if (!action.name) {
      setAction({ ...action, name: '' });
    }
    if (!action.ignoreFailure) {
      setAction({ ...action, ignoreFailure: false });
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
        label={'Directory Name'}
        placeholder={'new_folder'}
        value={action.name}
        onChange={(e) => setAction({ ...action, name: e.currentTarget.value })}
      />
      <Switch
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.currentTarget.checked })}
      />
    </Stack>
  );
};
