import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import AuthWrapper from './AuthWrapper';
import { useGlobalStore } from '@/stores/global';
import { useAuth } from '@/providers/AuthProvider';
import Button from '@/elements/Button';
import NumberInput from '@/elements/input/NumberInput';

export default () => {
  const navigate = useNavigate();
  const { doCheckpointLogin } = useAuth();
  const { twoFactorToken } = useGlobalStore();

  useEffect(() => {
    if (!twoFactorToken) {
      navigate('/auth/login');
    }
  }, []);

  const [faToken, setFaToken] = useState('');

  const submit = () => {
    doCheckpointLogin(faToken, twoFactorToken!);
  };

  return (
    <AuthWrapper title={'Two Factor Authentication'}>
      <div>
        <NumberInput
          placeholder={'Token'}
          value={faToken}
          autoComplete={'one-time-code'}
          onChange={(value) => setFaToken(String(value))}
        />

        <Button fullWidth onClick={submit} mt={'md'}>
          Login
        </Button>
      </div>
    </AuthWrapper>
  );
};
