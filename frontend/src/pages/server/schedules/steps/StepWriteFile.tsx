import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import { Stack } from '@mantine/core';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionWriteFile;
  setAction: (action: ScheduleActionWriteFile) => void;
}) => {
  return (
    <Stack>
      <TextInput
        withAsterisk
        label={'File Path'}
        placeholder={'/file.txt'}
        value={action.file}
        onChange={(e) => setAction({ ...action, file: e.currentTarget.value })}
      />
      <TextArea
        withAsterisk
        label={'Content'}
        placeholder={'File content here...'}
        autosize
        minRows={3}
        value={action.content}
        onChange={(e) => setAction({ ...action, content: e.currentTarget.value })}
      />
      <Switch
        label={'Append to File'}
        checked={action.append}
        onChange={(e) => setAction({ ...action, append: e.currentTarget.checked })}
      />
      <Switch
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.currentTarget.checked })}
      />
    </Stack>
  );
};
