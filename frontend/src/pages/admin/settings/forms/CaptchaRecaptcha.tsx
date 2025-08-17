import { Input } from '@/elements/inputs';
import { Dispatch, SetStateAction } from 'react';

export default ({
  settings,
  setSettings,
}: {
  settings: CaptchaProviderRecaptcha;
  setSettings: Dispatch<SetStateAction<CaptchaProviderRecaptcha>>;
}) => {
  return (
    <>
      <div className={'mt-4'}>
        <Input.Label htmlFor={'siteKey'}>Site Key</Input.Label>
        <Input.Text
          id={'siteKey'}
          placeholder={'Site Key'}
          value={settings.siteKey}
          onChange={(e) => setSettings((settings) => ({ ...settings, siteKey: e.target.value }))}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'secretKey'}>Secret Key</Input.Label>
        <Input.Text
          id={'secretKey'}
          placeholder={'Secret Key'}
          type={'password'}
          value={settings.secretKey}
          onChange={(e) => setSettings((settings) => ({ ...settings, secretKey: e.target.value }))}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Switch
          label={'V3'}
          name={'v3'}
          defaultChecked={settings.v3}
          onChange={(e) => setSettings((settings) => ({ ...settings, v3: e.target.checked }))}
        />
      </div>
    </>
  );
};
