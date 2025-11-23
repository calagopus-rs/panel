import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Stack, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import resetPassword from '@/api/auth/resetPassword';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import PasswordInput from '@/elements/input/PasswordInput';
import { useToast } from '@/providers/ToastProvider';
import AuthWrapper from './AuthWrapper';

const schema = z
  .object({
    password: z.string().min(8).max(512),
    confirmPassword: z.string().min(8).max(512),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ResetPassword() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = searchParams.get('token');

  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
  });

  useEffect(() => {
    if (!token) {
      navigate('/auth/login');
    }
  }, []);

  const submit = () => {
    setLoading(true);

    resetPassword(token, form.values)
      .then(() => {
        addToast('Password has been reset.', 'success');
        navigate('/auth/login');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
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
              Reset Password
            </Title>
            <Text c='dimmed' ta='center'>
              Please enter your new password
            </Text>

            <PasswordInput placeholder='Password' {...form.getInputProps('password')} />
            <PasswordInput placeholder='Confirm Password' {...form.getInputProps('confirmPassword')} />

            <Button onClick={submit} loading={loading} disabled={!form.isValid()} size='md' fullWidth>
              Reset Password
            </Button>
          </Stack>
        </Card>
      </Stack>
    </AuthWrapper>
  );
}
