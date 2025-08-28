import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import { useServerStore } from '@/stores/server';
import { Stack } from '@mantine/core';
import { useEffect } from 'react';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionUpdateStartupDockerImage;
  setAction: (action: ScheduleActionUpdateStartupDockerImage) => void;
}) => {
  const { server } = useServerStore();

  useEffect(() => {
    if (!action.image) {
      setAction({ ...action, image: '' });
    }
    if (!action.ignoreFailure) {
      setAction({ ...action, ignoreFailure: false });
    }
  }, [action, setAction]);

  return (
    <Stack>
      <Select
        label={'Docker Image'}
        value={action.image}
        onChange={(value) => setAction({ ...action, image: value })}
        data={Object.entries(server.egg.dockerImages).map(([key, value]) => ({
          value,
          label: key,
        }))}
      />
      <Switch
        label={'Ignore Failure'}
        checked={action.ignoreFailure}
        onChange={(e) =>
          setAction({
            ...action,
            ignoreFailure: e.currentTarget.checked,
          })
        }
      />
    </Stack>
  );
};
