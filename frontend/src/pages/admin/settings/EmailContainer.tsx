import { Button } from '@/elements/button';
import { useToast } from '@/providers/ToastProvider';
import { SettingContainer } from './AdminSettings';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import { Input } from '@/elements/inputs';
import updateEmailSettings from '@/api/admin/settings/updateEmailSettings';
import { transformKeysToSnakeCase } from '@/api/transformers';
import { httpErrorToHuman } from '@/api/axios';
import EmailSmtp from './forms/EmailSmtp';

export default () => {
  const { addToast } = useToast();
  const { mailMode } = useAdminStore();

  const [type, setType] = useState<MailModeType>(mailMode.type);

  const [settings, setSettings] = useState<MailMode>(mailMode);

  const handleUpdate = () => {
    updateEmailSettings(transformKeysToSnakeCase({ type, ...settings } as MailMode))
      .then(() => {
        addToast('Email settings updated.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <SettingContainer title={'Email Settings'}>
      <div className="mt-4">
        <Input.Label htmlFor={'type'}>Type</Input.Label>
        <Input.Dropdown
          id={'type'}
          options={[
            { label: 'None', value: 'none' },
            { label: 'SMTP', value: 'smtp' },
          ]}
          selected={type}
          onChange={e => setType(e.target.value as MailModeType)}
        />
      </div>

      {type === 'smtp' && <EmailSmtp settings={settings as MailModeSmtp} setSettings={setSettings} />}

      <div className="mt-4 flex justify-end">
        <Button onClick={handleUpdate}>Update Email Settings</Button>
      </div>
    </SettingContainer>
  );
};
