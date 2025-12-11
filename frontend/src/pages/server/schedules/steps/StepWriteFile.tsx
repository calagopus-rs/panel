import { Group, Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput';

export default function StepWriteFile({
  action,
  setAction,
}: {
  action: ScheduleActionWriteFile;
  setAction: (action: ScheduleActionWriteFile) => void;
}) {
  return (
    <Stack>
      <ScheduleDynamicParameterInput
        withAsterisk
        label='File Path'
        placeholder='/file.txt'
        value={action.file}
        onChange={(v) => setAction({ ...action, file: v })}
      />
      <ScheduleDynamicParameterInput
        withAsterisk
        label='Content'
        placeholder='File content here...'
        textArea
        value={action.content}
        onChange={(v) => setAction({ ...action, content: v })}
      />
      <Group>
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
      </Group>
    </Stack>
  );
}
