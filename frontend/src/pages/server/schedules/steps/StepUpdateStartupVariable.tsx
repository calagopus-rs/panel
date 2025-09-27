import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { Stack } from '@mantine/core';

export default ({
  action,
  setAction,
}: {
  action: ScheduleActionUpdateStartupVariable;
  setAction: (action: ScheduleActionUpdateStartupVariable) => void;
}) => {
  return (
    <Stack>
      <TextInput
        withAsterisk
        label={'Environment Variable'}
        placeholder={'JAVA_OPTS'}
        value={action.envVariable}
        onChange={(e) => setAction({ ...action, envVariable: e.target.value })}
      />
      <TextInput
        withAsterisk
        label={'Value'}
        placeholder={'-Xmx2G -Xms1G'}
        value={action.value}
        onChange={(e) => setAction({ ...action, value: e.target.value })}
      />
      <Switch
        label={'Ignore Failure'}
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
};
