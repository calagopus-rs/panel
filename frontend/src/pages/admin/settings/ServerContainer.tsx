import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import updateServerSettings from '@/api/admin/settings/updateServerSettings';
import { Group, Title } from '@mantine/core';
import NumberInput from '@/elements/inputnew/NumberInput';
import Switch from '@/elements/inputnew/Switch';
import NewButton from '@/elements/button/NewButton';
import { load } from '@/lib/debounce';

export default () => {
  const { addToast } = useToast();
  const { server } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [serverSettings, setServerSettings] = useState<AdminSettings['server']>(server);

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

      <NumberInput
        label={'Max File Manager View Size'}
        placeholder={'Max File Manager View Size'}
        value={serverSettings.maxFileManagerViewSize}
        onChange={(e) => setServerSettings({ ...serverSettings, maxFileManagerViewSize: Number(e) })}
        mt={'sm'}
      />

      <Switch
        label={'Allow Overwriting Custom Docker Image'}
        checked={serverSettings.allowOverwritingCustomDockerImage}
        onChange={(e) =>
          setServerSettings({ ...serverSettings, allowOverwritingCustomDockerImage: e.currentTarget.checked })
        }
        mt={'sm'}
      />

      <Switch
        label={'Allow Editing Startup Command'}
        checked={serverSettings.allowEditingStartupCommand}
        onChange={(e) => setServerSettings({ ...serverSettings, allowEditingStartupCommand: e.currentTarget.checked })}
        mt={'sm'}
      />

      <Group mt={'md'}>
        <NewButton onClick={doUpdate} loading={loading}>
          Save
        </NewButton>
      </Group>
    </>
  );
};
