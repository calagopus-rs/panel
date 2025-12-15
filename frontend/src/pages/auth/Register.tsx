import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Divider, Stack, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import register from '@/api/auth/register.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import Captcha, { CaptchaRef } from '@/elements/Captcha.tsx';
import Card from '@/elements/Card.tsx';
import PasswordInput from '@/elements/input/PasswordInput.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { authRegisterSchema } from '@/lib/schemas/auth.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import AuthWrapper from './AuthWrapper.tsx';

export default function Register() {
  const { doLogin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const captchaRef = useRef<CaptchaRef>(null);

  const form = useForm<z.infer<typeof authRegisterSchema>>({
    initialValues: {
      username: '',
      email: '',
      nameFirst: '',
      nameLast: '',
      password: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(authRegisterSchema),
  });

  const submit = () => {
    setLoading(true);

    captchaRef.current?.getToken().then((token) => {
      register({ ...form.values, captcha: token })
        .then((response) => {
          doLogin(response.user!);
        })
        .catch((msg) => {
          setError(httpErrorToHuman(msg));
        })
        .finally(() => setLoading(false));
    });
  };

  return (
    <AuthWrapper>
      <Stack>
        {error && (
          <Alert
            icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
            color='red'
            title='Error'
            onClose={() => setError('')}
            withCloseButton
          >
            {error}
          </Alert>
        )}
        <Card>
          <Stack>
            <Title order={2} ta='center'>
              Register
            </Title>
            <Text c='dimmed' ta='center'>
              Please enter your details to register
            </Text>

            <TextInput placeholder='Username' {...form.getInputProps('username')} />
            <TextInput placeholder='Email' {...form.getInputProps('email')} />
            <TextInput placeholder='First Name' {...form.getInputProps('nameFirst')} />
            <TextInput placeholder='Last Name' {...form.getInputProps('nameLast')} />
            <PasswordInput placeholder='Password' {...form.getInputProps('password')} />
            <Captcha ref={captchaRef} />

            <Button onClick={submit} loading={loading} disabled={!form.isValid()} size='md' fullWidth>
              Register
            </Button>

            <Divider label='OR' labelPosition='center' />

            <Button variant='light' onClick={() => navigate('/auth/login')} size='md' fullWidth>
              Login
            </Button>
          </Stack>
        </Card>
      </Stack>
    </AuthWrapper>
  );
}
