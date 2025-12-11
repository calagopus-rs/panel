import { Stack } from '@mantine/core';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import TagsInput from '@/elements/input/TagsInput';
import { archiveFormatLabelMapping } from '@/lib/enums';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput';

export default function StepCompressFiles({
  action,
  setAction,
}: {
  action: ScheduleActionCompressFiles;
  setAction: (action: ScheduleActionCompressFiles) => void;
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
        label='Files to Compress'
        placeholder='Add files to compress'
        value={action.files || []}
        onChange={(e) => setAction({ ...action, files: e })}
      />
      <Select
        withAsterisk
        label='Archive Format'
        data={Object.entries(archiveFormatLabelMapping).map(([value, label]) => ({
          value,
          label,
        }))}
        value={action.format}
        onChange={(value) => setAction({ ...action, format: value as ArchiveFormat })}
      />
      <ScheduleDynamicParameterInput
        withAsterisk
        label='Archive Name'
        placeholder='backup.tar.gz'
        value={action.name}
        onChange={(v) => setAction({ ...action, name: v })}
      />
      <Switch
        label='Run in Foreground'
        checked={action.foreground}
        onChange={(e) => setAction({ ...action, foreground: e.target.checked })}
      />
      <Switch
        label='Ignore Failure'
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.target.checked })}
      />
    </Stack>
  );
}
