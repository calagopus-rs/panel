import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import { serverPowerActionLabelMapping } from '@/lib/enums';
import { Stack } from '@mantine/core';
import { useEffect } from 'react';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionSendPower;
  setAction: (action: ScheduleActionSendPower) => void;
}) => {
  useEffect(() => {
    if (!action.action) {
      setAction({ ...action, action: 'start' });
    }
    if (!action.ignoreFailure) {
      setAction({ ...action, ignoreFailure: false });
    }
  }, [action, setAction]);

  return (
    <Stack>
      <Select
        label={'Power Action'}
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
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) => setAction({ ...action, ignoreFailure: e.currentTarget.checked })}
      />
    </Stack>
  );
};
