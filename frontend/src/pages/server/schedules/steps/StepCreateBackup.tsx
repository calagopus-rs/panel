import { Group, Stack } from '@mantine/core';
import Switch from '@/elements/input/Switch.tsx';
import TagsInput from '@/elements/input/TagsInput.tsx';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput.tsx';

export default function StepCreateBackup({
  action,
  setAction,
}: {
  action: ScheduleActionCreateBackup;
  setAction: (action: ScheduleActionCreateBackup) => void;
}) {
  return (
    <Stack>
      <ScheduleDynamicParameterInput
        label='Backup Name'
        placeholder='Backup Name'
        allowNull
        value={action.name}
        onChange={(v) => setAction({ ...action, name: v })}
      />
      <Group>
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
      </Group>
      <TagsInput
        label='Ignored Files'
        placeholder='Add files to ignore'
        value={action.ignoredFiles || []}
        onChange={(e) => setAction({ ...action, ignoredFiles: e })}
      />
    </Stack>
  );
}
