import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import AuthWrapper from './AuthWrapper';
import { useGlobalStore } from '@/stores/global';
import { useAuth } from '@/providers/AuthProvider';

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    doCheckpointLogin(faToken, twoFactorToken!);
  };

  return (
    <AuthWrapper title="Two Factor Authentication">
      <form onSubmit={submit}>
        <div className="mb-4">
          <Input.Text
            autoFocus
            id={'token'}
            variant={Input.Text.Variants.Loose}
            placeholder="Token"
            type="text"
            autoComplete="one-time-code"
            className="bg-gray-700!"
            value={faToken}
            onChange={e => setFaToken(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
    </AuthWrapper>
  );
};
