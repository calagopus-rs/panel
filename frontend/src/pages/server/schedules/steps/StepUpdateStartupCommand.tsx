import { Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch.tsx';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput.tsx';

export default function StepUpdateStartupCommand({
  action,
  setAction,
}: {
  action: ScheduleActionUpdateStartupCommand;
  setAction: (action: ScheduleActionUpdateStartupCommand) => void;
}) {
  return (
    <Stack>
      <ScheduleDynamicParameterInput
        withAsterisk
        label='Startup Command'
        placeholder='java -jar server.jar'
        value={action.command}
        onChange={(v) => setAction({ ...action, command: v })}
      />
      <Switch
        label='Ignore Failure'
        checked={action.ignoreFailure}
        onChange={(e) =>
          setAction({
            ...action,
            ignoreFailure: e.target.checked,
          })
        }
      />
    </Stack>
  );
}
