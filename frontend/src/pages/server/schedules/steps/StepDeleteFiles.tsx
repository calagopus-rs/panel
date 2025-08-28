import TagsInput from '@/elements/input/TagsInput';
import TextInput from '@/elements/input/TextInput';
import { Stack } from '@mantine/core';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionDeleteFiles;
  setAction: (action: ScheduleActionDeleteFiles) => void;
}) => {
  return (
    <Stack>
      <TextInput
        withAsterisk
        label={'Root Path'}
        placeholder={'/'}
        value={action.root}
        onChange={(e) => setAction({ ...action, root: e.currentTarget.value })}
      />
      <TagsInput
        withAsterisk
        label={'Files to Delete'}
        placeholder={'Add files to delete'}
        value={action.files || []}
        onChange={(value) => setAction({ ...action, files: value })}
      />
    </Stack>
  );
};
