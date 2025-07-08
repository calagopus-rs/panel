import { Button } from '@/elements/button';
import { useToast } from '@/providers/ToastProvider';
import { SettingContainer } from './AdminSettings';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import { Input } from '@/elements/inputs';
import { transformKeysToSnakeCase } from '@/api/transformers';
import { httpErrorToHuman } from '@/api/axios';
import updateCaptchaSettings from '@/api/admin/settings/updateCaptchaSettings';
import CaptchaTurnstile from './forms/CaptchaTurnstile';
import CaptchaRecaptcha from './forms/CaptchaRecaptcha';

export default () => {
  const { addToast } = useToast();
  const { captchaProvider } = useAdminStore();

  const [settings, setSettings] = useState<CaptchaProvider>(captchaProvider);

  const handleUpdate = () => {
    updateCaptchaSettings(transformKeysToSnakeCase({ ...settings } as CaptchaProvider))
      .then(() => {
        addToast('Captcha settings updated.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <SettingContainer title="Captcha Settings">
      <div className="mt-4">
        <Input.Label htmlFor="type">Type</Input.Label>
        <Input.Dropdown
          id="type"
          options={[
            { label: 'None', value: 'none' },
            { label: 'Turnstile', value: 'turnstile' },
            { label: 'reCAPTCHA', value: 'recaptcha' },
          ]}
          selected={settings.type}
          onChange={e => setSettings((settings: any) => ({ ...settings, type: e.target.value }))}
        />
      </div>

      {settings.type === 'turnstile' ? (
        <CaptchaTurnstile settings={settings as CaptchaProviderTurnstile} setSettings={setSettings} />
      ) : settings.type === 'recaptcha' ? (
        <CaptchaRecaptcha settings={settings as CaptchaProviderRecaptcha} setSettings={setSettings} />
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button onClick={handleUpdate}>Update Captcha Settings</Button>
      </div>
    </SettingContainer>
  );
};
