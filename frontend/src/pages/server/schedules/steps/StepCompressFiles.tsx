import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import TagsInput from '@/elements/input/TagsInput';
import TextInput from '@/elements/input/TextInput';
import { archiveFormatLabelMapping } from '@/lib/enums';
import { Stack } from '@mantine/core';
import { useEffect } from 'react';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionCompressFiles;
  setAction: (action: ScheduleActionCompressFiles) => void;
}) => {
  useEffect(() => {
    if (!action.root) {
      setAction({ ...action, root: '/' });
    }
    if (!action.files) {
      setAction({ ...action, files: [] });
    }
    if (!action.format) {
      setAction({ ...action, format: 'tar_gz' });
    }
    if (!action.name) {
      setAction({ ...action, name: 'backup.tar.gz' });
    }
    if (!action.ignoreFailure) {
      setAction({ ...action, ignoreFailure: false });
    }
    if (!action.foreground) {
      setAction({ ...action, foreground: false });
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
      <TagsInput
        withAsterisk
        label={'Files to Compress'}
        placeholder={'Add files to compress'}
        value={action.files || []}
        onChange={(e) => setAction({ ...action, files: e })}
      />
      <Select
        label={'Archive Format'}
        data={Object.entries(archiveFormatLabelMapping).map(([value, label]) => ({
          value,
          label,
        }))}
        value={action.format}
        onChange={(value) => setAction({ ...action, format: value as ArchiveFormat })}
      />
      <TextInput
        label={'Archive Name'}
        placeholder={'backup.tar.gz'}
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
    </Stack>
  );
};
