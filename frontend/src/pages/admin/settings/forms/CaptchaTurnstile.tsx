import { Input } from '@/elements/inputs';

export default ({ settings, setSettings }: { settings: CaptchaProviderTurnstile; setSettings: Function }) => {
  return (
    <>
      <div className="mt-4">
        <Input.Label htmlFor="siteKey">Site Key</Input.Label>
        <Input.Text
          id="siteKey"
          placeholder="Site Key"
          value={settings.siteKey}
          onChange={e => setSettings((settings: any) => ({ ...settings, siteKey: e.target.value }))}
        />
      </div>

      <div className="mt-4">
        <Input.Label htmlFor="secretKey">Secret Key</Input.Label>
        <Input.Text
          id="secretKey"
          placeholder="Secret Key"
          type="password"
          value={settings.secretKey}
          onChange={e => setSettings((settings: any) => ({ ...settings, secretKey: e.target.value }))}
        />
      </div>
    </>
  );
};
