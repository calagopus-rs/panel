import { faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Card, Divider, Stack, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import forgotPassword from '@/api/auth/forgotPassword';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Captcha, { CaptchaRef } from '@/elements/Captcha';
import TextInput from '@/elements/input/TextInput';
import AuthWrapper from './AuthWrapper';
import { authForgotPasswordSchema } from '@/lib/schemas/auth';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requested, setRequested] = useState(false);
  const captchaRef = useRef<CaptchaRef>(null);

  const form = useForm<z.infer<typeof authForgotPasswordSchema>>({
    initialValues: {
      email: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(authForgotPasswordSchema),
  });

  const submit = () => {
    setLoading(true);

    captchaRef.current?.getToken().then((token) => {
      forgotPassword(form.values, token)
        .then(() => {
          setSuccess('An email has been sent to you with instructions on how to reset your password.');
          setRequested(true);
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
        {success && (
          <Alert
            icon={<FontAwesomeIcon icon={faInfoCircle} />}
            color='green'
            title='Success'
            onClose={() => setSuccess('')}
            withCloseButton
          >
            {success}
          </Alert>
        )}

        <Card>
          <Stack>
            <Title order={2} ta='center'>
              Forgot Password
            </Title>
            <Text c='dimmed' ta='center'>
              Enter your email to receive instructions on how to reset your password
            </Text>

            <TextInput placeholder='Email' {...form.getInputProps('email')} />
            <Captcha ref={captchaRef} />

            <Button onClick={submit} loading={loading} disabled={requested || !form.isValid()} size='md' fullWidth>
              Request Password Reset
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
