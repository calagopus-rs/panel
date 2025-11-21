import { Group, Stack, Text } from '@mantine/core';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';

export default function StepRenameFiles({
  action,
  setAction,
}: {
  action: ScheduleActionRenameFiles;
  setAction: (action: ScheduleActionRenameFiles) => void;
}) {
  return (
    <Stack>
      <TextInput
        withAsterisk
        label='Root Path'
        placeholder='/'
        value={action.root}
        onChange={(e) => setAction({ ...action, root: e.target.value })}
      />

      <Stack gap='xs'>
        <Text>Files</Text>
        {action.files.map((file, index) => (
          <Group key={index}>
            <TextInput
              withAsterisk
              label='from'
              placeholder='source.txt'
              value={file.from}
              onChange={(e) => {
                const newFiles = [...action.files];
                newFiles[index].from = e.target.value;
                setAction({ ...action, files: newFiles });
              }}
            />
            <TextInput
              withAsterisk
              label='to'
              placeholder='target.txt'
              value={file.to}
              onChange={(e) => {
                const newFiles = [...action.files];
                newFiles[index].to = e.target.value;
                setAction({ ...action, files: newFiles });
              }}
            />
          </Group>
        ))}
      </Stack>

      <Button onClick={() => setAction({ ...action, files: [...action.files, { from: '', to: '' }] })}>Add File</Button>
    </Stack>
  );
}
