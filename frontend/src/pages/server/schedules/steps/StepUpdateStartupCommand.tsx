import { Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';

export default function StepUpdateStartupCommand({
  action,
  setAction,
}: {
  action: ScheduleActionUpdateStartupCommand;
  setAction: (action: ScheduleActionUpdateStartupCommand) => void;
}) {
  return (
    <Stack>
      <TextArea
        withAsterisk
        label={'Startup Command'}
        placeholder={'java -jar server.jar'}
        value={action.command}
        onChange={(e) => setAction({ ...action, command: e.target.value })}
      />
      <Switch
        label={'Ignore Failure'}
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
