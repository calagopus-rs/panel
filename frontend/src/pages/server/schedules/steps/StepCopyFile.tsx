import { Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';

export default function StepCopyFile({
  action,
  setAction,
}: {
  action: ScheduleActionCopyFile;
  setAction: (action: ScheduleActionCopyFile) => void;
}) {
  return (
    <Stack>
      <TextInput
        withAsterisk
        label='Source File'
        placeholder='/source.txt'
        value={action.file}
        onChange={(e) => setAction({ ...action, file: e.target.value })}
      />
      <TextInput
        withAsterisk
        label='Destination'
        placeholder='/backup/target.txt'
        value={action.destination}
        onChange={(e) => setAction({ ...action, destination: e.target.value })}
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
