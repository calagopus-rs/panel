import { faInfoCircle, faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import login from '@/api/auth/login';
import { httpErrorToHuman } from '@/api/axios';
import AlertError from '@/elements/alerts/AlertError';
import Button from '@/elements/Button';
import PasswordInput from '@/elements/input/PasswordInput';
import TextInput from '@/elements/input/TextInput';
import { to } from '@/lib/routes';
import { useAuth } from '@/providers/AuthProvider';
import { OobeComponentProps, steps } from '@/routers/OobeRouter';
import { useGlobalStore } from '@/stores/global';
import { oobeLoginSchema } from '@/lib/schemas/oobe';

export default function OobeLogin({ onNext }: OobeComponentProps) {
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
        Log back in
      </Title>

      {error && <AlertError error={error} setError={setError} />}

      <Alert icon={<FontAwesomeIcon icon={faInfoCircle} />} color='blue' variant='light'>
        You got logged out during the setup process. Please log back in to continue where you left off.
      </Alert>

      <Stack gap='md'>
        <TextInput
          label='Username'
          placeholder='admin'
          leftSection={<FontAwesomeIcon icon={faUser} size='sm' />}
          required
          {...form.getInputProps('username')}
        />

        <PasswordInput
          label='Password'
          placeholder='Enter a strong password'
          leftSection={<FontAwesomeIcon icon={faLock} size='sm' />}
          required
          {...form.getInputProps('password')}
        />

        <Group justify='flex-end' mt='xl'>
          <Button disabled={!form.isValid()} loading={loading} onClick={onSubmit}>
            Log in & Continue
          </Button>
        </Group>
      </Stack>
    </Stack>
  );
}
