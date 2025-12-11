import { Stack } from '@mantine/core';
import TagsInput from '@/elements/input/TagsInput';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput';

export default function StepDeleteFiles({
  action,
  setAction,
}: {
  action: ScheduleActionDeleteFiles;
  setAction: (action: ScheduleActionDeleteFiles) => void;
}) {
  return (
    <Stack>
      <ScheduleDynamicParameterInput
        withAsterisk
        label='Root Path'
        placeholder='/'
        value={action.root}
        onChange={(v) => setAction({ ...action, root: v })}
      />
      <TagsInput
        withAsterisk
        label='Files to Delete'
        placeholder='Add files to delete'
        value={action.files || []}
        onChange={(value) => setAction({ ...action, files: value })}
      />
    </Stack>
  );
}
