import { Button } from '@/elements/button';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import { Input } from '@/elements/inputs';
import updateEmailSettings from '@/api/admin/settings/updateEmailSettings';
import { transformKeysToSnakeCase } from '@/api/transformers';
import { httpErrorToHuman } from '@/api/axios';
import EmailSmtp from './forms/EmailSmtp';
import AdminSettingContainer from '@/elements/AdminSettingContainer';

export default () => {
  const { addToast } = useToast();
  const { mailMode } = useAdminStore();

  const [settings, setSettings] = useState<MailMode>(mailMode);

  const handleUpdate = () => {
    updateEmailSettings(transformKeysToSnakeCase({ ...settings } as MailMode))
      .then(() => {
        addToast('Email settings updated.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <AdminSettingContainer title="Email Settings">
      <div className="mt-4">
        <Input.Label htmlFor="type">Type</Input.Label>
        <Input.Dropdown
          id="type"
          options={[
            { label: 'None', value: 'none' },
            { label: 'SMTP', value: 'smtp' },
          ]}
          selected={settings.type}
          onChange={e => setSettings((settings: any) => ({ ...settings, type: e.target.value }))}
        />
      </div>

      {settings.type === 'smtp' && <EmailSmtp settings={settings as MailModeSmtp} setSettings={setSettings} />}

      <div className="mt-4 flex justify-end">
        <Button onClick={handleUpdate}>Update Email Settings</Button>
      </div>
    </AdminSettingContainer>
  );
};
