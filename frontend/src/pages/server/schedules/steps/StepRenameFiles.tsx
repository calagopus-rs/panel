import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import { Group, Stack, Text } from '@mantine/core';
import { useEffect } from 'react';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionRenameFiles;
  setAction: (action: ScheduleActionRenameFiles) => void;
}) => {
  useEffect(() => {
    if (!action.root) {
      setAction({ ...action, root: '/' });
    }
    if (!action.files) {
      setAction({ ...action, files: [] });
    }
  }, [action, setAction]);

  return (
    <Stack>
      <TextInput
        label={'Root Path'}
        placeholder={'/'}
        value={action.root}
        onChange={(e) => setAction({ ...action, root: e.currentTarget.value })}
      />

      <Text>Files</Text>
      {action.files.map((file, index) => (
        <Group key={index}>
          <TextInput
            label={'from'}
            placeholder={'source.txt'}
            value={file.from}
            onChange={(e) => {
              const newFiles = [...action.files];
              newFiles[index].from = e.currentTarget.value;
              setAction({ ...action, files: newFiles });
            }}
          />
          <TextInput
            label={'to'}
            placeholder={'target.txt'}
            value={file.to}
            onChange={(e) => {
              const newFiles = [...action.files];
              newFiles[index].to = e.currentTarget.value;
              setAction({ ...action, files: newFiles });
            }}
          />
        </Group>
      ))}
      <Button onClick={() => setAction({ ...action, files: [...action.files, { from: '', to: '' }] })}>Add File</Button>
    </Stack>
  );
};
