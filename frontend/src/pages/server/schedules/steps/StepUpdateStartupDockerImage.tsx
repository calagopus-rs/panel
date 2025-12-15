import { Stack } from '@mantine/core';
import Select from '@/elements/input/Select.tsx';
import Switch from '@/elements/input/Switch.tsx';
import { useServerStore } from '@/stores/server.ts';

export default function StepUpdateStartupDockerImage({
  action,
  setAction,
}: {
  action: ScheduleActionUpdateStartupDockerImage;
  setAction: (action: ScheduleActionUpdateStartupDockerImage) => void;
}) {
  const server = useServerStore((state) => state.server);

  return (
    <Stack>
      <Select
        withAsterisk
        label='Docker Image'
        value={action.image}
        onChange={(value) => setAction({ ...action, image: value || '' })}
        data={Object.entries(server.egg.dockerImages).map(([key, value]) => ({
          value,
          label: key,
        }))}
      />
      <Switch
        label='Ignore Failure'
        checked={action.ignoreFailure}
        onChange={(e) =>
          setAction({
            ...action,
            ignoreFailure: e.target.checked,
          })
        }
      />
    </Stack>
  );
}
