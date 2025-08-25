import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import AuthWrapper from './AuthWrapper';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import resetPassword from '@/api/auth/resetPassword';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { Stack } from '@mantine/core';

export default () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/auth/login');
    }
  }, []);

  const submit = () => {
    resetPassword(token, password)
      .then(() => {
        addToast('Password has been reset.', 'success');
        navigate('/auth/login');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <AuthWrapper title={'Reset Password'}>
      <Stack>
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

        <Button fullWidth onClick={submit} disabled={password !== confirmPassword}>
          Reset Password
        </Button>
      </Stack>
    </AuthWrapper>
  );
};
