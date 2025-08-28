import Switch from '@/elements/input/Switch';
import TagsInput from '@/elements/input/TagsInput';
import TextInput from '@/elements/input/TextInput';
import { Stack } from '@mantine/core';
import { useEffect } from 'react';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionCreateBackup;
  setAction: (action: ScheduleActionCreateBackup) => void;
}) => {
  useEffect(() => {
    if (!action.name) {
      setAction({ ...action, name: '' });
    }
    if (!action.foreground) {
      setAction({ ...action, foreground: false });
    }
    if (!action.ignoreFailure) {
      setAction({ ...action, ignoreFailure: false });
    }
    if (!action.ignoredFiles) {
      setAction({ ...action, ignoredFiles: [] });
    }
  }, [action, setAction]);

  return (
    <Stack>
      <TextInput
        label={'Backup Name (optional)'}
        placeholder={'Auto-generated if empty'}
        value={action.name}
        onChange={(e) => setAction({ ...action, name: e.currentTarget.value })}
      />
      <Switch
        label={'Run in Foreground'}
        checked={action.foreground}
        onChange={(e) => setAction({ ...action, foreground: e.currentTarget.checked })}
      />
      <Switch
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.currentTarget.checked })}
      />
      <TagsInput
        withAsterisk
        label={'Ignored Files'}
        placeholder={'Add files to ignore'}
        value={action.ignoredFiles || []}
        onChange={(e) => setAction({ ...action, ignoredFiles: e })}
      />
    </Stack>
  );
};
