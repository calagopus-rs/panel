import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import { useServerStore } from '@/stores/server';
import { Stack } from '@mantine/core';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionUpdateStartupDockerImage;
  setAction: (action: ScheduleActionUpdateStartupDockerImage) => void;
}) => {
  const server = useServerStore((state) => state.server);

  return (
    <Stack>
      <Select
        withAsterisk
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
