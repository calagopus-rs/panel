import { Group, Modal as MantineModal, Stack, Text, useModalsStack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import enableTwoFactor from '@/api/me/account/enableTwoFactor.ts';
import getTwoFactor from '@/api/me/account/getTwoFactor.ts';
import Button from '@/elements/Button.tsx';
import Code from '@/elements/Code.tsx';
import CopyOnClick from '@/elements/CopyOnClick.tsx';
import PasswordInput from '@/elements/input/PasswordInput.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import Spinner from '@/elements/Spinner.tsx';
import { dashboardTwoFactorEnableSchema } from '@/lib/schemas/dashboard.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';

export interface TwoFactorSetupResponse {
  otpUrl: string;
  secret: string;
}

export default function TwoFactorSetupButton() {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { user, setUser } = useAuth();

  const stageStack = useModalsStack(['setup', 'recovery']);

  const [token, setToken] = useState<TwoFactorSetupResponse | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof dashboardTwoFactorEnableSchema>>({
    initialValues: {
      code: '',
      password: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(dashboardTwoFactorEnableSchema),
  });

  useEffect(() => {
    if (!open) {
      stageStack.open('setup');
      setRecoveryCodes([]);
      form.reset();
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
    setLoading(true);

    enableTwoFactor(form.values)
      .then(({ recoveryCodes }) => {
        setRecoveryCodes(recoveryCodes);
        addToast(t('pages.account.account.containers.twoFactor.toast.enabled', {}), 'warning');
        stageStack.open('recovery');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <MantineModal.Stack>
        <Modal
          {...stageStack.register('setup')}
          title={t('pages.account.account.containers.twoFactor.modal.setupTwoFactor.title', {})}
        >
          <Stack>
            <Text>{t('pages.account.account.containers.twoFactor.modal.setupTwoFactor.description', {})}</Text>
            {!token ? (
              <Spinner.Centered />
            ) : (
              <div className='flex flex-col items-center justify-center my-4'>
                <div className='flex items-center justify-center w-56 h-56 p-2 bg-gray-50 shadow'>
                  <QRCode title='QR Code' value={token.otpUrl} />
                </div>
                <div className='mt-2'>
                  <CopyOnClick content={token.secret}>
                    <Code>{token.secret.match(/.{1,4}/g)!.join(' ') || 'Loading...'}</Code>
                  </CopyOnClick>
                </div>
              </div>
            )}
            <Text>{t('pages.account.account.containers.twoFactor.modal.setupTwoFactor.descriptionQR', {}).md()}</Text>

            <TextInput
              withAsterisk
              label={t('pages.account.account.containers.twoFactor.modal.setupTwoFactor.form.code', {})}
              placeholder='000000'
              autoComplete='one-time-code'
              {...form.getInputProps('code')}
            />

            <PasswordInput
              withAsterisk
              label={t('common.form.password', {})}
              placeholder={t('common.form.password', {})}
              autoComplete='current-password'
              {...form.getInputProps('password')}
            />

            <Group>
              <Button onClick={doEnable} loading={loading} disabled={!form.isValid()}>
                {t('common.button.enable', {})}
              </Button>
              <Button variant='default' onClick={() => stageStack.closeAll()}>
                {t('common.button.close', {})}
              </Button>
            </Group>
          </Stack>
        </Modal>
        <Modal
          {...stageStack.register('recovery')}
          onClose={() => {
            setUser({ ...user!, totpEnabled: true });
            stageStack.close('recovery');
          }}
          title={t('pages.account.account.containers.twoFactor.modal.recoveryCodes.title', {})}
        >
          <Stack>
            <Text>{t('pages.account.account.containers.twoFactor.modal.recoveryCodes.description', {})}</Text>
            <CopyOnClick content={recoveryCodes.join('\n')}>
              <Code block className='grid grid-cols-2 w-full gap-x-2'>
                {recoveryCodes.map((code, i) => (
                  <span key={code} className={i % 2 === 0 ? 'text-right' : 'text-left'}>
                    {code}
                  </span>
                ))}
              </Code>
            </CopyOnClick>
            <Group>
              <Button
                variant='default'
                onClick={() => {
                  setUser({ ...user!, totpEnabled: true });
                  stageStack.closeAll();
                }}
              >
                {t('common.button.close', {})}
              </Button>
            </Group>
          </Stack>
        </Modal>
      </MantineModal.Stack>

      <Button onClick={() => stageStack.open('setup')}>
        {t('pages.account.account.containers.twoFactor.button.setupTwoFactor', {})}
      </Button>
    </>
  );
}
