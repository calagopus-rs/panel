import { httpErrorToHuman } from '@/api/axios';
import enableTwoFactor from '@/api/me/account/enableTwoFactor';
import getTwoFactor from '@/api/me/account/getTwoFactor';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import CopyOnClick from '@/elements/CopyOnClick';
import NumberInput from '@/elements/input/NumberInput';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import Spinner from '@/elements/Spinner';
import { load } from '@/lib/debounce';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Group, Modal as MantineModal, Stack, Text, useModalsStack } from '@mantine/core';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

export interface TwoFactorSetupResponse {
  otpUrl: string;
  secret: string;
}

export default () => {
  const { addToast } = useToast();
  const { user, setUser } = useAuth();

  const stageStack = useModalsStack(['setup', 'recovery']);

  const [token, setToken] = useState<TwoFactorSetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      stageStack.open('setup');
      setCode('');
      setPassword('');
      setRecoveryCodes([]);
      return;
    }

    getTwoFactor()
      .then((res) => {
        setToken(res);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [open]);

  const doEnable = () => {
    load(true, setLoading);

    enableTwoFactor(code, password)
      .then(({ recoveryCodes }) => {
        setRecoveryCodes(recoveryCodes);
        addToast('Two-factor authentication enabled. Please copy your recovery codes.', 'warning');
        stageStack.open('recovery');
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
      <MantineModal.Stack>
        <Modal {...stageStack.register('setup')} title={'Enable Two-Step Verification'}>
          <Stack>
            <Text>
              Help protect your account from unauthorized access. You&apos;ll be prompted for a verification code each
              time you sign in.
            </Text>
            {!token ? (
              <Spinner.Centered />
            ) : (
              <div className={'flex flex-col items-center justify-center my-4'}>
                <div className={'flex items-center justify-center w-56 h-56 p-2 bg-gray-50 shadow'}>
                  <QRCode title={'QR Code'} value={token.otpUrl} />
                </div>
                <div className={'mt-2'}>
                  <CopyOnClick content={token.secret}>
                    <Code>{token?.secret.match(/.{1,4}/g)!.join(' ') || 'Loading...'}</Code>
                  </CopyOnClick>
                </div>
              </div>
            )}
            <Text>
              Scan the QR code above using the two-step authentication app of your choice. Then, enter the 6-digit code
              generated into the field below.
            </Text>

            <NumberInput
              withAsterisk
              label={'Code'}
              placeholder={'000000'}
              value={code}
              onChange={(value) => setCode(String(value))}
            />

            <TextInput
              withAsterisk
              label={'Password'}
              placeholder={'Password'}
              type={'password'}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Group>
              <Button onClick={doEnable} loading={loading} disabled={!code || !password}>
                Enable
              </Button>
              <Button variant={'default'} onClick={() => stageStack.closeAll()}>
                Close
              </Button>
            </Group>
          </Stack>
        </Modal>
        <Modal
          {...stageStack.register('recovery')}
          onClose={() => {
            stageStack.close('recovery');
            setUser({ ...user!, totpEnabled: true });
          }}
          title={'Recovery Codes'}
        >
          <Stack>
            <CopyOnClick content={recoveryCodes.join('\n')}>
              <Code block className={'grid grid-cols-2 w-full gap-x-2'}>
                {recoveryCodes.map((code, i) => (
                  <span key={code} className={i % 2 === 0 ? 'text-right' : 'text-left'}>
                    {code}
                  </span>
                ))}
              </Code>
            </CopyOnClick>
            <Group>
              <Button variant={'default'} onClick={() => stageStack.closeAll()}>
                Close
              </Button>
            </Group>
          </Stack>
        </Modal>
      </MantineModal.Stack>

      <Button onClick={() => stageStack.open('setup')}>Enable Two-Step</Button>
    </>
  );
};
