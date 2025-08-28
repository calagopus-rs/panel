import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import { Stack } from '@mantine/core';
import { useEffect } from 'react';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionWriteFile;
  setAction: (action: ScheduleActionWriteFile) => void;
}) => {
  useEffect(() => {
    if (!action.file) {
      setAction({ ...action, file: '/file.txt' });
    }
    if (!action.content) {
      setAction({ ...action, content: '' });
    }
    if (!action.ignoreFailure) {
      setAction({ ...action, ignoreFailure: false });
    }
  }, [action, setAction]);

  return (
    <Stack>
      <TextInput
        label={'File Path'}
        placeholder={'/file.txt'}
        value={action.file}
        onChange={(e) => setAction({ ...action, file: e.currentTarget.value })}
      />
      <TextArea
        label={'Content'}
        placeholder={'File content here...'}
        autosize
        minRows={3}
        value={action.content}
        onChange={(e) => setAction({ ...action, content: e.currentTarget.value })}
      />
      <Switch
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.currentTarget.checked })}
      />
    </Stack>
  );
};
