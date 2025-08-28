import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';
import { Stack } from '@mantine/core';
import { useEffect } from 'react';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionUpdateStartupCommand;
  setAction: (action: ScheduleActionUpdateStartupCommand) => void;
}) => {
  useEffect(() => {
    if (!action.command) {
      setAction({ ...action, command: '' });
    }
    if (!action.ignoreFailure) {
      setAction({ ...action, ignoreFailure: false });
    }
  }, [action, setAction]);

  return (
    <Stack>
      <TextArea
        label={'Startup Command'}
        placeholder={'java -jar server.jar'}
        value={action.command}
        onChange={(e) => setAction({ ...action, command: e.currentTarget.value })}
      />
      <Switch
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) =>
          setAction({
            ...action,
            ignoreFailure: e.currentTarget.checked,
          })
        }
      />
    </Stack>
  );
};
