import { faEnvelope, faLock, faShieldHalved, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import register from '@/api/auth/register';
import { httpErrorToHuman } from '@/api/axios';
import AlertError from '@/elements/alerts/AlertError';
import Button from '@/elements/Button';
import PasswordInput from '@/elements/input/PasswordInput';
import TextInput from '@/elements/input/TextInput';
import { useAuth } from '@/providers/AuthProvider';
import { OobeComponentProps } from '@/routers/OobeRouter';

const schema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(15)
      .regex(/^[a-zA-Z0-9_]+$/),
    email: z.email(),
    nameFirst: z.string().min(2).max(255),
    nameLast: z.string().min(2).max(255),
    password: z.string().min(8).max(512),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function OobeRegister({ onNext }: OobeComponentProps) {
  const { doLogin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      username: '',
      email: '',
      nameFirst: '',
      nameLast: '',
      password: '',
      confirmPassword: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
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
