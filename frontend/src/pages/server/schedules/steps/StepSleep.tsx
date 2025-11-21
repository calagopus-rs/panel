import NumberInput from '@/elements/input/NumberInput';

export default function StepSleep({
  action,
  setAction,
}: {
  action: ScheduleActionSleep;
  setAction: (action: ScheduleActionSleep) => void;
}) {
  return (
    <NumberInput
      withAsterisk
      label='Duration (milliseconds)'
      placeholder='1000'
      min={1}
      value={action.duration}
      onChange={(value) => setAction({ ...action, duration: Number(value) })}
    />
  );
}
