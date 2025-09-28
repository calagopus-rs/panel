import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import updateServerSettings from '@/api/admin/settings/updateServerSettings';
import { Group, Stack, Title } from '@mantine/core';
import Switch from '@/elements/input/Switch';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import { bytesToString } from '@/lib/size';
import NumberInput from '@/elements/input/NumberInput';
import SizeInput from '@/elements/input/SizeInput';

export default () => {
  const { addToast } = useToast();
  const { server } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [serverSettings, setServerSettings] = useState<AdminSettings['server']>(server);
  const [maxFileManagerViewSizeInput, setMaxFileManagerViewSizeInput] = useState<string>(
    bytesToString(server.maxFileManagerViewSize),
  );

  const doUpdate = () => {
    load(true, setLoading);
    updateServerSettings(serverSettings)
      .then(() => {
        addToast('Server settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <>
      <Title mt={'md'} order={2}>
        Server Settings
      </Title>

      <Stack>
        <Group grow>
          <SizeInput
            label={'Max File Manager View Size + Unit (e.g. 2GB)'}
            placeholder={'Max File Manager View Size'}
            value={maxFileManagerViewSizeInput}
            setState={setMaxFileManagerViewSizeInput}
            onChange={(value) => setServerSettings({ ...serverSettings, maxFileManagerViewSize: value })}
          />

          <NumberInput
            label={'Max Server Schedule Steps'}
            placeholder={'Max Server Schedule Steps'}
            value={serverSettings.maxSchedulesStepCount}
            onChange={(value) => {
              setServerSettings({ ...serverSettings, maxSchedulesStepCount: Number(value) });
            }}
          />
        </Group>

        <Group grow>
          <Switch
            label={'Allow Overwriting Custom Docker Image'}
            checked={serverSettings.allowOverwritingCustomDockerImage}
            onChange={(e) =>
              setServerSettings({ ...serverSettings, allowOverwritingCustomDockerImage: e.currentTarget.checked })
            }
          />

          <Switch
            label={'Allow Editing Startup Command'}
            checked={serverSettings.allowEditingStartupCommand}
            onChange={(e) =>
              setServerSettings({ ...serverSettings, allowEditingStartupCommand: e.currentTarget.checked })
            }
          />
        </Group>
      </Stack>

      <Group mt={'md'}>
        <Button onClick={doUpdate} loading={loading}>
          Save
        </Button>
      </Group>
    </>
  );
};
