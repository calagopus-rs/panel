import { Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';

export default function StepSendCommand({
  action,
  setAction,
}: {
  action: ScheduleActionSendCommand;
  setAction: (action: ScheduleActionSendCommand) => void;
}) {
  return (
    <Stack>
      <TextArea
        withAsterisk
        label={'Command'}
        placeholder={'say Hello World'}
        value={action.command}
        onChange={(e) => setAction({ ...action, command: e.target.value })}
      />
      <Switch
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.target.checked })}
      />
    </Stack>
  );
}
