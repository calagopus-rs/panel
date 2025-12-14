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
import { OobeComponentProps, steps } from '@/routers/OobeRouter.tsx';
import { useGlobalStore } from '@/stores/global.ts';

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

      <form onSubmit={form.onSubmit(() => onSubmit())}>
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
            <Button type='submit' disabled={!form.isValid()} loading={loading}>
              Log in & Continue
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
