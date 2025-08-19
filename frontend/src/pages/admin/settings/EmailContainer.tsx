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
import { load } from '@/lib/debounce';
import { Group, Title } from '@mantine/core';
import NewButton from '@/elements/button/NewButton';
import Select from '@/elements/inputnew/Select';

export default () => {
  const { addToast } = useToast();
  const { mailMode } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<MailMode>(mailMode);

  const doUpdate = () => {
    load(true, setLoading);
    updateEmailSettings(transformKeysToSnakeCase({ ...settings } as MailMode))
      .then(() => {
        addToast('Email settings updated.', 'success');
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
        Email Settings
      </Title>

      <Select
        label={'Provider'}
        value={settings.type}
        onChange={(value) => setSettings((settings) => ({ ...settings, type: value }))}
        data={[
          { label: 'None', value: 'none' },
          { label: 'SMTP', value: 'smtp' },
        ]}
      />

      {settings.type === 'smtp' && <EmailSmtp settings={settings as MailModeSmtp} setSettings={setSettings} />}

      <Group mt={'md'}>
        <NewButton onClick={doUpdate} loading={loading}>
          Save
        </NewButton>
      </Group>
    </>
  );
};
