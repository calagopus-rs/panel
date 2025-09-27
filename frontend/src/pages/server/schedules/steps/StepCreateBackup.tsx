import Switch from '@/elements/input/Switch';
import TagsInput from '@/elements/input/TagsInput';
import TextInput from '@/elements/input/TextInput';
import { Stack } from '@mantine/core';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionCreateBackup;
  setAction: (action: ScheduleActionCreateBackup) => void;
}) => {
  return (
    <Stack>
      <TextInput
        label={'Backup Name'}
        placeholder={'Auto-generated if empty'}
        value={action.name || ''}
        onChange={(e) => setAction({ ...action, name: e.target.value || null })}
      />
      <Switch
        label={'Run in Foreground'}
        checked={action.foreground}
        onChange={(e) => setAction({ ...action, foreground: e.target.checked })}
      />
      <Switch
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.target.checked })}
      />
      <TagsInput
        label={'Ignored Files'}
        placeholder={'Add files to ignore'}
        value={action.ignoredFiles || []}
        onChange={(e) => setAction({ ...action, ignoredFiles: e })}
      />
    </Stack>
  );
};
