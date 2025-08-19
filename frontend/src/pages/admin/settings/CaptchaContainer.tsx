import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import { transformKeysToSnakeCase } from '@/api/transformers';
import { httpErrorToHuman } from '@/api/axios';
import updateCaptchaSettings from '@/api/admin/settings/updateCaptchaSettings';
import CaptchaTurnstile from './forms/CaptchaTurnstile';
import CaptchaRecaptcha from './forms/CaptchaRecaptcha';
import { Group, Title } from '@mantine/core';
import Select from '@/elements/inputnew/Select';
import NewButton from '@/elements/button/NewButton';
import { load } from '@/lib/debounce';

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
        data={[
          { label: 'None', value: 'none' },
          { label: 'Turnstile', value: 'turnstile' },
          { label: 'reCAPTCHA', value: 'recaptcha' },
        ]}
      />

      {settings.type === 'turnstile' ? (
        <CaptchaTurnstile settings={settings as CaptchaProviderTurnstile} setSettings={setSettings} />
      ) : settings.type === 'recaptcha' ? (
        <CaptchaRecaptcha settings={settings as CaptchaProviderRecaptcha} setSettings={setSettings} />
      ) : null}

      <Group mt={'md'}>
        <NewButton onClick={doUpdate} loading={loading}>
          Save
        </NewButton>
      </Group>
    </>
  );
};
