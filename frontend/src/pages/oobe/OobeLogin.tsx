import { faInfoCircle, faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import login from '@/api/auth/login.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import AlertError from '@/elements/alerts/AlertError.tsx';
import Button from '@/elements/Button.tsx';
import PasswordInput from '@/elements/input/PasswordInput.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { to } from '@/lib/routes.ts';
import { oobeLoginSchema } from '@/lib/schemas/oobe.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { OobeComponentProps, steps } from '@/routers/OobeRouter.tsx';
import { useGlobalStore } from '@/stores/global.ts';

export default function OobeLogin({ onNext }: OobeComponentProps) {
  const { t } = useTranslations();
  const { doLogin } = useAuth();
  const navigate = useNavigate();
  const { settings } = useGlobalStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<z.infer<typeof oobeLoginSchema>>({
    initialValues: {
      username: '',
      password: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(oobeLoginSchema),
  });

  const onSubmit = async () => {
    setLoading(true);

    login({
      user: form.values.username,
      password: form.values.password,
      captcha: '',
    })
      .then((response) => {
        doLogin(response.user!, false);

        const nextStep = steps.find((step) => step.stepKey === settings.oobeStep);
        if (nextStep) {
          navigate(to(nextStep.path, '/oobe'));
        } else {
          onNext();
        }
      })
      .catch((msg) => {
        setError(httpErrorToHuman(msg));
      })
      .finally(() => setLoading(false));
  };

  return (
    <Stack gap='lg' py='md'>
      <Title order={2} mb='xs'>
        {t('pages.oobe.login.title', {})}
      </Title>

      {error && <AlertError error={error} setError={setError} />}

      <Alert icon={<FontAwesomeIcon icon={faInfoCircle} />} color='blue' variant='light'>
        {t('pages.oobe.login.alert', {})}
      </Alert>

      <form onSubmit={form.onSubmit(() => onSubmit())}>
        <Stack gap='md'>
          <TextInput
            label={t('pages.oobe.login.form.username', {})}
            placeholder={t('pages.oobe.login.form.usernamePlaceholder', {})}
            leftSection={<FontAwesomeIcon icon={faUser} size='sm' />}
            required
            {...form.getInputProps('username')}
          />

          <PasswordInput
            label={t('pages.oobe.login.form.password', {})}
            placeholder={t('pages.oobe.login.form.passwordPlaceholder', {})}
            leftSection={<FontAwesomeIcon icon={faLock} size='sm' />}
            required
            {...form.getInputProps('password')}
          />

          <Group justify='flex-end' mt='xl'>
            <Button type='submit' disabled={!form.isValid()} loading={loading}>
              {t('pages.oobe.login.button.login', {})}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
