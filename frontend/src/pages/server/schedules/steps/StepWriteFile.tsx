import { Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';

export default function StepWriteFile({
  action,
  setAction,
}: {
  action: ScheduleActionWriteFile;
  setAction: (action: ScheduleActionWriteFile) => void;
}) {
  return (
    <Stack>
      <TextInput
        withAsterisk
        label='File Path'
        placeholder='/file.txt'
        value={action.file}
        onChange={(e) => setAction({ ...action, file: e.target.value })}
      />
      <TextArea
        withAsterisk
        label='Content'
        placeholder='File content here...'
        autosize
        minRows={3}
        value={action.content}
        onChange={(e) => setAction({ ...action, content: e.target.value })}
      />
      <Switch
        label='Append to File'
        checked={action.append}
        onChange={(e) => setAction({ ...action, append: e.target.checked })}
      />
      <Switch
        label='Ignore Failure'
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.target.checked })}
      />
    </Stack>
  );
}
