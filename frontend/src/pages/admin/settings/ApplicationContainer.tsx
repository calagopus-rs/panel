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

  const [name, setName] = useState(app.name);
  const [icon, setIcon] = useState(app.icon);
  const [url, setUrl] = useState(app.url);
  const [telemetryEnabled, setTelemetryEnabled] = useState(app.telemetryEnabled);

  const handleUpdate = () => {
    updateApplicationSettings({ name, icon, url, telemetryEnabled })
      .then(() => {
        addToast('Application settings updated.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <AdminSettingContainer title="Application Settings">
      <div className="mt-4">
        <Input.Label htmlFor="type">Name</Input.Label>
        <Input.Text id="name" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="mt-4">
        <Input.Label htmlFor="icon">Icon</Input.Label>
        <Input.Text id="icon" placeholder="Icon" value={icon} onChange={e => setIcon(e.target.value)} />
      </div>

      <div className="mt-4">
        <Input.Label htmlFor="url">URL</Input.Label>
        <Input.Text id="url" placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} />
      </div>

      <div className="mt-4">
        <Input.Switch
          description="Enable Telemetry"
          name="telemetryEnabled"
          defaultChecked={telemetryEnabled}
          onChange={e => setTelemetryEnabled(e.target.checked)}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleUpdate}>Update Application Settings</Button>
      </div>
    </AdminSettingContainer>
  );
};
