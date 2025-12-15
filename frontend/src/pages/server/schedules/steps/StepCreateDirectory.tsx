import { Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch.tsx';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput.tsx';

export default function StepCreateDirectory({
  action,
  setAction,
}: {
  action: ScheduleActionCreateDirectory;
  setAction: (action: ScheduleActionCreateDirectory) => void;
}) {
  return (
    <Stack>
      <ScheduleDynamicParameterInput
        withAsterisk
        label='Root Path'
        placeholder='/'
        value={action.root}
        onChange={(v) => setAction({ ...action, root: v })}
      />
      <ScheduleDynamicParameterInput
        withAsterisk
        label='Directory Name'
        placeholder='new_folder'
        value={action.name}
        onChange={(v) => setAction({ ...action, name: v })}
      />
      <Switch
        label='Ignore Failure'
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.target.checked })}
      />
    </Stack>
  );
}
