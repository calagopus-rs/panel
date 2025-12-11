import { Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput';

export default function StepCopyFile({
  action,
  setAction,
}: {
  action: ScheduleActionCopyFile;
  setAction: (action: ScheduleActionCopyFile) => void;
}) {
  return (
    <Stack>
      <ScheduleDynamicParameterInput
        withAsterisk
        label='Source File'
        placeholder='/source.txt'
        value={action.file}
        onChange={(v) => setAction({ ...action, file: v })}
      />
      <ScheduleDynamicParameterInput
        withAsterisk
        label='Destination'
        placeholder='/backup/target.txt'
        value={action.destination}
        onChange={(v) => setAction({ ...action, destination: v })}
      />
      <Switch
        label='Run in Foreground'
        checked={action.foreground}
        onChange={(e) => setAction({ ...action, foreground: e.target.checked })}
      />
      <Switch
        label='Ignore Failure'
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.target.checked })}
      />
    </Stack>
  );
}
