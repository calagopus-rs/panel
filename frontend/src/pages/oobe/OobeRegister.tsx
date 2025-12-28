import { faEnvelope, faLock, faShieldHalved, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import register from '@/api/auth/register.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import AlertError from '@/elements/alerts/AlertError.tsx';
import Button from '@/elements/Button.tsx';
import PasswordInput from '@/elements/input/PasswordInput.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { oobeRegister } from '@/lib/schemas/oobe.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { OobeComponentProps } from '@/routers/OobeRouter.tsx';

export default function OobeRegister({ onNext }: OobeComponentProps) {
  const { t } = useTranslations();
  const { doLogin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<z.infer<typeof oobeRegister>>({
    initialValues: {
      username: '',
      email: '',
      nameFirst: '',
      nameLast: '',
      password: '',
      confirmPassword: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(oobeRegister),
  });

  const onSubmit = async () => {
    setLoading(true);

    register({
      username: form.values.username,
      email: form.values.email,
      nameFirst: form.values.nameFirst,
      nameLast: form.values.nameLast,
      password: form.values.password,
      captcha: '',
    })
      .then((response) => {
        doLogin(response.user!, false);
        console.log('next');
        onNext();
      })
      .catch((msg) => {
        setError(httpErrorToHuman(msg));
      })
      .finally(() => setLoading(false));
  };

  return (
    <Stack gap='lg' py='md'>
      <Title order={2} mb='xs'>
        {t('pages.oobe.register.title', {})}
      </Title>

      {error && <AlertError error={error} setError={setError} />}

      <Alert
        icon={<FontAwesomeIcon icon={faShieldHalved} />}
        title={t('pages.oobe.register.alert.title', {})}
        color='blue'
        variant='light'
      >
        {t('pages.oobe.register.alert.description', {})}
      </Alert>

      <form onSubmit={form.onSubmit(() => onSubmit())}>
        <Stack gap='md'>
          <TextInput
            label={t('pages.oobe.register.form.username', {})}
            placeholder={t('pages.oobe.register.form.usernamePlaceholder', {})}
            leftSection={<FontAwesomeIcon icon={faUser} size='sm' />}
            required
            {...form.getInputProps('username')}
          />

          <TextInput
            label={t('pages.oobe.register.form.email', {})}
            placeholder={t('pages.oobe.register.form.emailPlaceholder', {})}
            leftSection={<FontAwesomeIcon icon={faEnvelope} size='sm' />}
            type='email'
            required
            {...form.getInputProps('email')}
          />

          <TextInput
            label={t('pages.oobe.register.form.firstName', {})}
            placeholder={t('pages.oobe.register.form.firstNamePlaceholder', {})}
            leftSection={<FontAwesomeIcon icon={faUser} size='sm' />}
            required
            {...form.getInputProps('nameFirst')}
          />

          <TextInput
            label={t('pages.oobe.register.form.lastName', {})}
            placeholder={t('pages.oobe.register.form.lastNamePlaceholder', {})}
            leftSection={<FontAwesomeIcon icon={faUser} size='sm' />}
            required
            {...form.getInputProps('nameLast')}
          />

          <PasswordInput
            label={t('pages.oobe.register.form.password', {})}
            placeholder={t('pages.oobe.register.form.passwordPlaceholder', {})}
            leftSection={<FontAwesomeIcon icon={faLock} size='sm' />}
            required
            {...form.getInputProps('password')}
          />

          <PasswordInput
            label={t('pages.oobe.register.form.confirmPassword', {})}
            placeholder={t('pages.oobe.register.form.confirmPasswordPlaceholder', {})}
            leftSection={<FontAwesomeIcon icon={faLock} size='sm' />}
            required
            {...form.getInputProps('confirmPassword')}
          />

          <Group justify='flex-end' mt='xl'>
            <Button type='submit' disabled={!form.isValid()} loading={loading}>
              {t('pages.oobe.register.button.create', {})}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
