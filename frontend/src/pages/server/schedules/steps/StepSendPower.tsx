import { Stack } from '@mantine/core';
import Select from '@/elements/input/Select.tsx';
import Switch from '@/elements/input/Switch.tsx';
import { serverPowerActionLabelMapping } from '@/lib/enums.ts';

export default function StepSendPower({
  action,
  setAction,
}: {
  action: ScheduleActionSendPower;
  setAction: (action: ScheduleActionSendPower) => void;
}) {
  return (
    <Stack>
      <Select
        withAsterisk
        label='Power Action'
        data={Object.entries(serverPowerActionLabelMapping).map(([value, label]) => ({
          value,
          label,
        }))}
        value={action.action}
        onChange={(value) => {
          setAction({ ...action, action: value as ServerPowerAction });
        }}
      />
      <Switch
        label='Ignore Failure'
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.target.checked })}
      />
    </Stack>
  );
}
