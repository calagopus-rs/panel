import { Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch.tsx';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput.tsx';

export default function StepSendCommand({
  action,
  setAction,
}: {
  action: ScheduleActionSendCommand;
  setAction: (action: ScheduleActionSendCommand) => void;
}) {
  return (
    <Stack>
      <ScheduleDynamicParameterInput
        withAsterisk
        label='Command'
        placeholder='say Hello World'
        value={action.command}
        onChange={(v) => setAction({ ...action, command: v })}
      />
      <Switch
        label='Ignore Failure'
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.target.checked })}
      />
    </Stack>
  );
}
