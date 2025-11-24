import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import updateEmailSettings from '@/api/admin/settings/updateEmailSettings';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import { mailModeTypeLabelMapping } from '@/lib/enums';
import { transformKeysToSnakeCase } from '@/lib/transformers';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import EmailFile from './forms/EmailFile';
import EmailSendmail from './forms/EmailSendmail';
import EmailSmtp from './forms/EmailSmtp';

export default function EmailContainer() {
  const { addToast } = useToast();
  const { mailMode } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<MailMode>(mailMode);

  const doUpdate = () => {
    setLoading(true);
    updateEmailSettings(transformKeysToSnakeCase({ ...settings } as MailMode))
      .then(() => {
        addToast('Email settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Title mt='md' order={2}>
        Email Settings
      </Title>

      <Select
        label='Provider'
        value={settings.type}
        onChange={(value) => setSettings((settings) => ({ ...settings, type: value as 'none' }))}
        data={Object.entries(mailModeTypeLabelMapping).map(([value, label]) => ({
          value,
          label,
        }))}
      />

      {settings.type === 'smtp' ? (
        <EmailSmtp settings={settings as MailModeSmtp} setSettings={setSettings} />
      ) : settings.type === 'sendmail' ? (
        <EmailSendmail settings={settings as MailModeSendmail} setSettings={setSettings} />
      ) : settings.type === 'filesystem' ? (
        <EmailFile settings={settings as MailModeFilesystem} setSettings={setSettings} />
      ) : null}

      <Group mt='md'>
        <Button onClick={doUpdate} loading={loading}>
          Save
        </Button>
      </Group>
    </>
  );
}
