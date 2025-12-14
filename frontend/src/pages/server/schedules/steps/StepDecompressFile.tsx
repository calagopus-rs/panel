import { Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch.tsx';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput.tsx';

export default function StepDecompressFile({
  action,
  setAction,
}: {
  action: ScheduleActionDecompressFile;
  setAction: (action: ScheduleActionDecompressFile) => void;
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
        label='File'
        placeholder='backup.tar.gz'
        value={action.file}
        onChange={(v) => setAction({ ...action, file: v })}
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
