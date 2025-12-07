import { Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';
import updateApplicationSettings from '@/api/admin/settings/updateApplicationSettings';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import Select from '@/elements/input/Select';
import { useGlobalStore } from '@/stores/global';

export default function ApplicationContainer() {
  const { addToast } = useToast();
  const { app } = useAdminStore();
  const { languages } = useGlobalStore();

  const [loading, setLoading] = useState(false);
  const [appSettings, setAppSettings] = useState<AdminSettings['app']>(app);

  const doUpdate = () => {
    setLoading(true);
    updateApplicationSettings(appSettings)
      .then(() => {
        addToast('Application settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Title mt='md' order={2}>
        Application Settings
      </Title>

      <Stack>
        <Group grow>
          <TextInput
            withAsterisk
            label='Name'
            placeholder='Name'
            value={appSettings.name || ''}
            onChange={(e) => setAppSettings({ ...appSettings, name: e.target.value })}
          />
          <Select
            withAsterisk
            label='Language'
            placeholder='Language'
            data={languages}
            searchable
            value={appSettings.language}
            onChange={(value) => setAppSettings({ ...appSettings, language: value || 'en-US' })}
          />
        </Group>

        <TextInput
          withAsterisk
          label='URL'
          placeholder='URL'
          value={appSettings.url || ''}
          onChange={(e) => setAppSettings({ ...appSettings, url: e.target.value })}
        />

        <Group grow>
          <Switch
            label='Enable Telemetry'
            description='Allow Calagopus to collect limited and anonymous usage data to help improve the application.'
            defaultChecked={appSettings.telemetryEnabled}
            onChange={(e) => setAppSettings((settings) => ({ ...settings, telemetryEnabled: e.target.checked }))}
          />
          <Switch
            label='Enable Registration'
            name='registrationEnabled'
            defaultChecked={appSettings.registrationEnabled}
            onChange={(e) => setAppSettings((settings) => ({ ...settings, registrationEnabled: e.target.checked }))}
          />
        </Group>
      </Stack>

      <Group mt='md'>
        <Button onClick={doUpdate} loading={loading}>
          Save
        </Button>
      </Group>
    </>
  );
}
