import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';
import { Stack } from '@mantine/core';
import { useEffect } from 'react';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionSendCommand;
  setAction: (action: ScheduleActionSendCommand) => void;
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
        label={'Command'}
        placeholder={'say Hello World'}
        value={action.command}
        onChange={(e) => setAction({ ...action, command: e.currentTarget.value })}
      />
      <Switch
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.currentTarget.checked })}
      />
    </Stack>
  );
};
