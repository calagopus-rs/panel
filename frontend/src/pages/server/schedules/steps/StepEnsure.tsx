import { Stack } from '@mantine/core';
import ScheduleConditionBuilder from '../ScheduleConditionBuilder.tsx';

export default function StepEnsure({
  action,
  setAction,
}: {
  action: ScheduleActionEnsure;
  setAction: (action: ScheduleActionEnsure) => void;
}) {
  return (
    <Stack>
      <ScheduleConditionBuilder
        condition={action.condition}
        onChange={(condition) => setAction({ ...action, condition })}
      />
    </Stack>
  );
}
