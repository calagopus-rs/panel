import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import updateApplicationSettings from '@/api/admin/settings/updateApplicationSettings';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/inputnew/TextInput';
import Switch from '@/elements/inputnew/Switch';
import { load } from '@/lib/debounce';
import NewButton from '@/elements/button/NewButton';

export default () => {
  const { addToast } = useToast();
  const { app } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [appSettings, setAppSettings] = useState<AdminSettings['app']>(app);

  const doUpdate = () => {
    load(true, setLoading);
    updateApplicationSettings(appSettings)
      .then(() => {
        addToast('Application settings updated.', 'success');
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
        Application Settings
      </Title>

      <Group grow>
        <TextInput
          label={'Name'}
          placeholder={'Name'}
          value={appSettings.name || ''}
          onChange={(e) => setAppSettings({ ...appSettings, name: e.target.value })}
          mt={'sm'}
        />
        <TextInput
          label={'URL'}
          placeholder={'URL'}
          value={appSettings.url || ''}
          onChange={(e) => setAppSettings({ ...appSettings, url: e.target.value })}
          mt={'sm'}
        />
      </Group>

      <TextInput
        label={'Icon'}
        placeholder={'Icon'}
        value={appSettings.icon || ''}
        onChange={(e) => setAppSettings({ ...appSettings, icon: e.target.value })}
        mt={'sm'}
      />

      <Switch
        label={'Enable Telemetry'}
        name={'telemetryEnabled'}
        defaultChecked={appSettings.telemetryEnabled}
        onChange={(e) => setAppSettings((settings) => ({ ...settings, telemetryEnabled: e.target.checked }))}
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
