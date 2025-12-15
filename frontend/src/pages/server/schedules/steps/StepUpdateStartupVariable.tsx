import { Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch.tsx';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput.tsx';

export default function StepUpdateStartupVariable({
  action,
  setAction,
}: {
  action: ScheduleActionUpdateStartupVariable;
  setAction: (action: ScheduleActionUpdateStartupVariable) => void;
}) {
  return (
    <Stack>
      <ScheduleDynamicParameterInput
        withAsterisk
        label='Environment Variable'
        placeholder='JAVA_OPTS'
        value={action.envVariable}
        onChange={(v) => setAction({ ...action, envVariable: v })}
      />
      <ScheduleDynamicParameterInput
        withAsterisk
        label='Value'
        placeholder='-Xmx2G -Xms1G'
        value={action.value}
        onChange={(v) => setAction({ ...action, value: v })}
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
