import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { Stack } from '@mantine/core';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionCreateDirectory;
  setAction: (action: ScheduleActionCreateDirectory) => void;
}) => {
  return (
    <Stack>
      <TextInput
        withAsterisk
        label={'Root Path'}
        placeholder={'/'}
        value={action.root}
        onChange={(e) => setAction({ ...action, root: e.target.value })}
      />
      <TextInput
        withAsterisk
        label={'Directory Name'}
        placeholder={'new_folder'}
        value={action.name}
        onChange={(e) => setAction({ ...action, name: e.target.value })}
      />
      <Switch
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.target.checked })}
      />
    </Stack>
  );
};
