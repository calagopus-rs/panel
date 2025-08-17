import { Button } from '@/elements/button';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import { Input } from '@/elements/inputs';
import { httpErrorToHuman } from '@/api/axios';
import updateApplicationSettings from '@/api/admin/settings/updateApplicationSettings';
import AdminSettingContainer from '@/elements/AdminSettingContainer';

export default () => {
  const { addToast } = useToast();
  const { app } = useAdminStore();

  const [appSettings, setAppSettings] = useState<AdminSettings['app']>(app);

  const handleUpdate = () => {
    updateApplicationSettings(appSettings)
      .then(() => {
        addToast('Application settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <AdminSettingContainer title={'Application Settings'}>
      <div className={'mt-4'}>
        <Input.Label htmlFor={'type'}>Name</Input.Label>
        <Input.Text
          id={'name'}
          placeholder={'Name'}
          value={appSettings.name || ''}
          onChange={(e) => setAppSettings({ ...appSettings, name: e.target.value })}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'icon'}>Icon</Input.Label>
        <Input.Text
          id={'icon'}
          placeholder={'Icon'}
          value={appSettings.icon || ''}
          onChange={(e) => setAppSettings({ ...appSettings, icon: e.target.value })}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'url'}>URL</Input.Label>
        <Input.Text
          id={'url'}
          placeholder={'URL'}
          value={appSettings.url || ''}
          onChange={(e) => setAppSettings({ ...appSettings, url: e.target.value })}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Switch
          label={'Enable Telemetry'}
          name={'telemetryEnabled'}
          defaultChecked={appSettings.telemetryEnabled}
          onChange={(e) => setAppSettings((settings) => ({ ...settings, telemetryEnabled: e.target.checked }))}
        />
      </div>

      <div className={'mt-4 flex justify-end'}>
        <Button onClick={handleUpdate}>Update Application Settings</Button>
      </div>
    </AdminSettingContainer>
  );
};
