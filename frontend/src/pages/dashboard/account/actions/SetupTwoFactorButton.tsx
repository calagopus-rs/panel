import { httpErrorToHuman } from '@/api/axios';
import enableTwoFactor from '@/api/me/enableTwoFactor';
import getTwoFactor from '@/api/me/getTwoFactor';
import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import CopyOnClick from '@/elements/CopyOnClick';
import { Dialog } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

export interface TwoFactorSetupResponse {
  otp_url: string;
  secret: string;
}

export default () => {
  const { addToast } = useToast();

  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<'setup' | 'recovery'>('setup');

  const [token, setToken] = useState<TwoFactorSetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setStage('setup');
      setCode('');
      setPassword('');
      setRecoveryCodes([]);
      return;
    }

    getTwoFactor()
      .then(res => {
        setToken(res);
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [open]);

  const submit = () => {
    enableTwoFactor(code, password)
      .then(recoveryCodes => {
        setRecoveryCodes(recoveryCodes.recovery_codes);
        addToast('Two-factor authentication enabled. Please copy your recovery codes.', 'warning');
        setStage('recovery');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog title={'Enable Two-Step Verification'} onClose={() => setOpen(false)} open={open}>
        {stage === 'setup' ? (
          <>
            <p>
              Help protect your account from unauthorized access. You'll be prompted for a verification code each time
              you sign in.
            </p>
            {!token ? (
              <Spinner.Centered />
            ) : (
              <div className="flex flex-col items-center justify-center my-4">
                <div className="flex items-center justify-center w-56 h-56 p-2 bg-gray-50 shadow">
                  <QRCode title="QR Code" value={token.otp_url} />
                </div>
                <div className="mt-2">
                  <CopyOnClick content={token.secret}>
                    <Code>{token?.secret.match(/.{1,4}/g)!.join(' ') || 'Loading...'}</Code>
                  </CopyOnClick>
                </div>
              </div>
            )}
            <p>
              Scan the QR code above using the two-step authentication app of your choice. Then, enter the 6-digit code
              generated into the field below.
            </p>

            <Input.Label htmlFor={'totpCode'}>Code</Input.Label>
            <Input.Text
              id={'code'}
              name={'code'}
              type={'number'}
              placeholder={'000000'}
              value={code}
              onChange={e => setCode(e.target.value)}
            />

            <Input.Label htmlFor={'password'}>Password</Input.Label>
            <Input.Text
              id={'password'}
              name={'password'}
              type={'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <Dialog.Footer>
              <Button onClick={submit} disabled={!code || !password}>
                Enable
              </Button>
              <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
                Close
              </Button>
            </Dialog.Footer>
          </>
        ) : (
          <>
            <p>Recovery codes:</p>
            <CopyOnClick content={recoveryCodes.join('\n')}>
              <Code>
                {recoveryCodes.map(code => (
                  <span>{code}</span>
                ))}
              </Code>
            </CopyOnClick>
            <Dialog.Footer>
              <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
                Close
              </Button>
            </Dialog.Footer>
          </>
        )}
      </Dialog>
      <Button onClick={() => setOpen(true)}>Enable Two-Step</Button>
    </>
  );
};
