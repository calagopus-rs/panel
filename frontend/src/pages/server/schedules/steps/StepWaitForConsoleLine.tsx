import { Stack } from '@mantine/core';
import NumberInput from '@/elements/input/NumberInput.tsx';
import Switch from '@/elements/input/Switch.tsx';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput.tsx';

export default function StepWaitForConsoleLine({
  action,
  setAction,
}: {
  action: ScheduleActionWaitForConsoleLine;
  setAction: (action: ScheduleActionWaitForConsoleLine) => void;
}) {
  return (
    <Stack>
      <ScheduleDynamicParameterInput
        label='Line contains'
        placeholder='Text to make sure is in the console line'
        value={action.contains}
        onChange={(v) => setAction({ ...action, contains: v })}
      />
      <NumberInput
        withAsterisk
        label='Timeout (milliseconds)'
        placeholder='1000'
        min={1}
        value={action.timeout}
        onChange={(value) => setAction({ ...action, timeout: Number(value) })}
      />
      <ScheduleDynamicParameterInput
        label='Output into'
        placeholder='Output the captured line into a variable'
        allowNull
        allowString={false}
        value={action.outputInto}
        onChange={(v) => setAction({ ...action, outputInto: v })}
      />
      <Switch
        label='Ignore Failure'
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.target.checked })}
      />
    </Stack>
  );
}
