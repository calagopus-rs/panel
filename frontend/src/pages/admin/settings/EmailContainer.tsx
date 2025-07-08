import { Button } from '@/elements/button';
import { useToast } from '@/providers/ToastProvider';
import { SettingContainer } from './AdminSettings';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import { Input } from '@/elements/inputs';
import updateEmailSettings from '@/api/admin/settings/updateEmailSettings';
import { transformKeysToSnakeCase } from '@/api/transformers';
import { httpErrorToHuman } from '@/api/axios';

export default () => {
  const { addToast } = useToast();
  const { mailMode } = useAdminStore();

  const [type, setType] = useState<MailModeType>(mailMode.type);

  const [host, setHost] = useState(mailMode.type === 'smtp' ? mailMode.host : '');
  const [port, setPort] = useState(mailMode.type === 'smtp' ? mailMode.port : 0);
  const [username, setUsername] = useState(mailMode.type === 'smtp' ? mailMode.username : '');
  const [password, setPassword] = useState(mailMode.type === 'smtp' ? mailMode.password : '');
  const [useTls, setUseTls] = useState(mailMode.type === 'smtp' ? mailMode.useTls : false);
  const [fromAddress, setFromAddress] = useState(mailMode.type === 'smtp' ? mailMode.fromAddress : '');
  const [fromName, setFromName] = useState(mailMode.type === 'smtp' ? mailMode.fromName : '');

  const handleUpdate = () => {
    updateEmailSettings(
      transformKeysToSnakeCase({ type, host, port, username, password, useTls, fromAddress, fromName }),
    )
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

      {type === 'smtp' && (
        <>
          <div className="mt-4">
            <Input.Label htmlFor="host">Host</Input.Label>
            <Input.Text id="host" placeholder="Host" value={host} onChange={e => setHost(e.target.value)} />
          </div>

          <div className="mt-4">
            <Input.Label htmlFor="port">Port</Input.Label>
            <Input.Text
              id="port"
              placeholder="Port"
              type="number"
              value={port}
              onChange={e => setPort(parseInt(e.target.value))}
            />
          </div>

          <div className="mt-4">
            <Input.Label htmlFor="username">Username</Input.Label>
            <Input.Text
              id="username"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <Input.Label htmlFor="password">Password</Input.Label>
            <Input.Text
              id="password"
              placeholder="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <Input.Switch
              description="Use TLS"
              name="useTls"
              defaultChecked={useTls}
              onChange={e => setUseTls(e.target.checked)}
            />
          </div>

          <div className="mt-4">
            <Input.Label htmlFor="fromAddress">From Address</Input.Label>
            <Input.Text
              id="fromAddress"
              placeholder="From Address"
              value={fromAddress}
              onChange={e => setFromAddress(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <Input.Label htmlFor="fromName">From Name</Input.Label>
            <Input.Text
              id="fromName"
              placeholder="From Name"
              value={fromName}
              onChange={e => setFromName(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="mt-4 flex justify-end">
        <Button onClick={handleUpdate}>Update Email Settings</Button>
      </div>
    </SettingContainer>
  );
};
