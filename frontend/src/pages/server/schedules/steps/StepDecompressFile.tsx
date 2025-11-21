import { Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';

export default function StepDecompressFile({
  action,
  setAction,
}: {
  action: ScheduleActionDecompressFile;
  setAction: (action: ScheduleActionDecompressFile) => void;
}) {
  return (
    <Stack>
      <TextInput
        withAsterisk
        label='Root Path'
        placeholder='/'
        value={action.root}
        onChange={(e) => setAction({ ...action, root: e.target.value })}
      />
      <TextInput
        withAsterisk
        label='File'
        placeholder='backup.tar.gz'
        value={action.file}
        onChange={(e) => setAction({ ...action, file: e.target.value })}
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
