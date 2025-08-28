import NumberInput from '@/elements/input/NumberInput';
import { useEffect } from 'react';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionSleep;
  setAction: (action: ScheduleActionSleep) => void;
}) => {
  useEffect(() => {
    if (!action.duration) {
      setAction({ ...action, duration: 1000 });
    }
  }, [action, setAction]);

  return (
    <NumberInput
      label={'Duration (milliseconds)'}
      placeholder={'1000'}
      min={1}
      value={action.duration}
      onChange={(value) => setAction({ ...action, duration: Number(value) })}
    />
  );
};
