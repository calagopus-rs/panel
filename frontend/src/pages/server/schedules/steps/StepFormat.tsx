import { Stack } from '@mantine/core';
import TextArea from '@/elements/input/TextArea.tsx';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput.tsx';

export default function StepFormat({
  action,
  setAction,
}: {
  action: ScheduleActionFormat;
  setAction: (action: ScheduleActionFormat) => void;
}) {
  return (
    <Stack>
      <TextArea
        withAsterisk
        label='Format String'
        description='The Format string, can include variables by wrapping inside {...}'
        placeholder='Hello {variable}!'
        value={action.format}
        onChange={(e) => setAction({ ...action, format: e.target.value })}
      />

      <ScheduleDynamicParameterInput
        label='Output into'
        placeholder='Output the concatinated string into a variable'
        allowString={false}
        value={action.outputInto}
        onChange={(v) => setAction({ ...action, outputInto: v })}
      />
    </Stack>
  );
}
