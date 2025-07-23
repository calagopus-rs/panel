import { Input } from '@/elements/inputs';
import { Dispatch, SetStateAction } from 'react';

export default ({
  settings,
  setSettings,
}: {
  settings: MailModeSmtp;
  setSettings: Dispatch<SetStateAction<MailMode>>;
}) => {
  return (
    <>
      <div className={'mt-4'}>
        <Input.Label htmlFor={'host'}>Host</Input.Label>
        <Input.Text
          id={'host'}
          placeholder={'Host'}
          value={settings.host}
          onChange={(e) => setSettings((settings) => ({ ...settings, host: e.target.value }))}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'port'}>Port</Input.Label>
        <Input.Text
          id={'port'}
          placeholder={'Port'}
          type={'number'}
          value={settings.port}
          onChange={(e) => setSettings((settings) => ({ ...settings, port: Number(e.target.value) }))}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'username'}>Username</Input.Label>
        <Input.Text
          id={'username'}
          placeholder={'Username'}
          value={settings.username}
          onChange={(e) => setSettings((settings) => ({ ...settings, username: e.target.value }))}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'password'}>Password</Input.Label>
        <Input.Text
          id={'password'}
          placeholder={'Password'}
          type={'password'}
          value={settings.password}
          onChange={(e) => setSettings((settings) => ({ ...settings, password: e.target.value }))}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Switch
          description={'Use TLS'}
          name={'useTls'}
          defaultChecked={settings.useTls}
          onChange={(e) => setSettings((settings) => ({ ...settings, useTls: e.target.checked }))}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'fromAddress'}>From Address</Input.Label>
        <Input.Text
          id={'fromAddress'}
          placeholder={'From Address'}
          value={settings.fromAddress}
          onChange={(e) => setSettings((settings) => ({ ...settings, fromAddress: e.target.value }))}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'fromName'}>From Name</Input.Label>
        <Input.Text
          id={'fromName'}
          placeholder={'From Name'}
          value={settings.fromName}
          onChange={(e) => setSettings((settings) => ({ ...settings, fromName: e.target.value }))}
        />
      </div>
    </>
  );
};
