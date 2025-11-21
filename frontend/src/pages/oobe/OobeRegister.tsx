import { faEnvelope, faLock, faShieldHalved, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import register from '@/api/auth/register';
import { httpErrorToHuman } from '@/api/axios';
import AlertError from '@/elements/alerts/AlertError';
import Button from '@/elements/Button';
import PasswordInput from '@/elements/input/PasswordInput';
import TextInput from '@/elements/input/TextInput';
import { useAuth } from '@/providers/AuthProvider';
import { OobeComponentProps } from '@/routers/OobeRouter';

interface RegisterFormValues {
  username: string;
  email: string;
  nameFirst: string;
  nameLast: string;
  password: string;
  confirmPassword: string;
}

export default function OobeRegister({ onNext }: OobeComponentProps) {
  const { doLogin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<RegisterFormValues>({
    initialValues: {
      username: '',
      email: '',
      nameFirst: '',
      nameLast: '',
      password: '',
      confirmPassword: '',
    },
    validateInputOnBlur: true,
    validate: {
      username: (value) => {
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (value.length > 15) return 'Username must not exceed 15 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers and underscores';
        return null;
      },
      email: (value) => {
        if (!value) return 'Email is required';
        return null;
      },
      nameFirst: (value) => {
        if (!value) return 'First name is required';
        if (value.length < 2) return 'First name must be at least 2 characters';
        if (value.length > 255) return 'First name must not exceed 255 characters';
        return null;
      },
      nameLast: (value) => {
        if (!value) return 'Last name is required';
        if (value.length < 2) return 'Last name must be at least 2 characters';
        if (value.length > 255) return 'Last name must not exceed 255 characters';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (value.length > 512) return 'Password must not exceed 512 characters';
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Please confirm your password';
        if (value !== values.password) return 'Passwords do not match';
        return null;
      },
    },
  });

  const onSubmit = async () => {
    setLoading(true);

    register({
      username: form.values.username,
      email: form.values.email,
      name_first: form.values.nameFirst,
      name_last: form.values.nameLast,
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
          <Button disabled={!form.isValid()} loading={loading} onClick={onSubmit}>
            Create Account & Continue
          </Button>
        </Group>
      </Stack>
    </Stack>
  );
}
