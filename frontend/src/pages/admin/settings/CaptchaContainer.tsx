import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import { transformKeysToSnakeCase } from '@/api/transformers';
import { httpErrorToHuman } from '@/api/axios';
import updateCaptchaSettings from '@/api/admin/settings/updateCaptchaSettings';
import CaptchaTurnstile from './forms/CaptchaTurnstile';
import CaptchaRecaptcha from './forms/CaptchaRecaptcha';
import { Group, Title } from '@mantine/core';
import Select from '@/elements/input/Select';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import { captchaProviderTypeLabelMapping } from '@/lib/enums';

export default () => {
  const { addToast } = useToast();
  const { captchaProvider } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AdminSettings['captchaProvider']>(captchaProvider);

  const doUpdate = () => {
    load(true, setLoading);
    updateCaptchaSettings(transformKeysToSnakeCase({ ...settings } as CaptchaProvider))
      .then(() => {
        addToast('Captcha settings updated.', 'success');
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
        Captcha Settings
      </Title>

      <Select
        label={'Provider'}
        value={settings.type}
        onChange={(value) => setSettings((settings) => ({ ...settings, type: value }))}
        data={Object.entries(captchaProviderTypeLabelMapping).map(([value, label]) => ({
          value,
          label,
        }))}
      />

      {settings.type === 'turnstile' ? (
        <CaptchaTurnstile settings={settings as CaptchaProviderTurnstile} setSettings={setSettings} />
      ) : settings.type === 'recaptcha' ? (
        <CaptchaRecaptcha settings={settings as CaptchaProviderRecaptcha} setSettings={setSettings} />
      ) : null}

      <Group mt={'md'}>
        <Button onClick={doUpdate} loading={loading}>
          Save
        </Button>
      </Group>
    </>
  );
};
