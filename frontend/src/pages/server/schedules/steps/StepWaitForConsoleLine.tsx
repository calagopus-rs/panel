import { Stack } from '@mantine/core';
import NumberInput from '@/elements/input/NumberInput';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';

export default function StepWaitForConsoleLine({
  action,
  setAction,
}: {
  action: ScheduleActionWaitForConsoleLine;
  setAction: (action: ScheduleActionWaitForConsoleLine) => void;
}) {
  return (
    <Stack>
      <TextInput
        label={'Line contains'}
        placeholder={'Text to make sure is in the console line'}
        value={action.contains || ''}
        onChange={(e) => setAction({ ...action, contains: e.target.value || null })}
      />
      <NumberInput
        withAsterisk
        label={'Timeout (milliseconds)'}
        placeholder={'1000'}
        min={1}
        value={action.timeout}
        onChange={(value) => setAction({ ...action, timeout: Number(value) })}
      />
      <Switch
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.target.checked })}
      />
    </Stack>
  );
}
