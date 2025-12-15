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
import { OobeComponentProps } from '@/routers/OobeRouter.tsx';

export default function OobeRegister({ onNext }: OobeComponentProps) {
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
        Create Administrator Account
      </Title>

      {error && <AlertError error={error} setError={setError} />}

      <Alert icon={<FontAwesomeIcon icon={faShieldHalved} />} title='Security Notice' color='blue' variant='light'>
        Choose a strong password. This account will have complete administrative access to all servers and settings.
      </Alert>

      <form onSubmit={form.onSubmit(() => onSubmit())}>
        <Stack gap='md'>
          <TextInput
            label='Username'
            placeholder='admin'
            leftSection={<FontAwesomeIcon icon={faUser} size='sm' />}
            required
            {...form.getInputProps('username')}
          />

          <TextInput
            label='Email Address'
            placeholder='admin@example.com'
            leftSection={<FontAwesomeIcon icon={faEnvelope} size='sm' />}
            type='email'
            required
            {...form.getInputProps('email')}
          />

          <TextInput
            label='First Name'
            placeholder='Alan'
            leftSection={<FontAwesomeIcon icon={faUser} size='sm' />}
            required
            {...form.getInputProps('nameFirst')}
          />

          <TextInput
            label='Last Name'
            placeholder='Turing'
            leftSection={<FontAwesomeIcon icon={faUser} size='sm' />}
            required
            {...form.getInputProps('nameLast')}
          />

          <PasswordInput
            label='Password'
            placeholder='Enter a strong password'
            leftSection={<FontAwesomeIcon icon={faLock} size='sm' />}
            required
            {...form.getInputProps('password')}
          />

          <PasswordInput
            label='Confirm Password'
            placeholder='Re-enter your password'
            leftSection={<FontAwesomeIcon icon={faLock} size='sm' />}
            required
            {...form.getInputProps('confirmPassword')}
          />

          <Group justify='flex-end' mt='xl'>
            <Button type='submit' disabled={!form.isValid()} loading={loading}>
              Create Account & Continue
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
