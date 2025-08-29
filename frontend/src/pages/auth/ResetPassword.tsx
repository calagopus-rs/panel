import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import AuthWrapper from './AuthWrapper';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import resetPassword from '@/api/auth/resetPassword';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { Alert, Stack, Text, Title } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import Card from '@/elements/Card';
import { load } from '@/lib/debounce';

export default () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/auth/login');
    }
  }, []);

  const submit = () => {
    load(true, setLoading);

    resetPassword(token, password)
      .then(() => {
        addToast('Password has been reset.', 'success');
        navigate('/auth/login');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <AuthWrapper>
      <Stack>
        {error && (
          <Alert
            icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
            color={'red'}
            title={'Error'}
            onClose={() => setError('')}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        <Card>
          <Stack>
            <Title order={2} ta={'center'}>
              Reset Password
            </Title>
            <Text c={'dimmed'} ta={'center'}>
              Please enter your new password
            </Text>

            <TextInput
              placeholder={'Password'}
              type={'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextInput
              placeholder={'Confirm Password'}
              type={'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button onClick={submit} loading={loading} disabled={password !== confirmPassword} size={'md'} fullWidth>
              Reset Password
            </Button>
          </Stack>
        </Card>
      </Stack>
    </AuthWrapper>
  );
};
