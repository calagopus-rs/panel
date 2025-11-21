import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import updateCaptchaSettings from '@/api/admin/settings/updateCaptchaSettings';
import { httpErrorToHuman } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import { captchaProviderTypeLabelMapping } from '@/lib/enums';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import CaptchaRecaptcha from './forms/CaptchaRecaptcha';
import CaptchaTurnstile from './forms/CaptchaTurnstile';

export default function CaptchaContainer() {
  const { addToast } = useToast();
  const { captchaProvider } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AdminSettings['captchaProvider']>(captchaProvider);

  const doUpdate = () => {
    setLoading(true);

    updateCaptchaSettings(transformKeysToSnakeCase({ ...settings } as CaptchaProvider))
      .then(() => {
        addToast('Captcha settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Title mt='md' order={2}>
        Captcha Settings
      </Title>

      <Select
        label='Provider'
        value={settings.type}
        onChange={(value) => setSettings((settings) => ({ ...settings, type: value as 'none' }))}
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

      <Group mt='md'>
        <Button onClick={doUpdate} loading={loading}>
          Save
        </Button>
      </Group>
    </>
  );
}
