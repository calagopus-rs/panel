import login from '@/api/auth/login';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useUserStore } from '@/stores/user';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import AuthWrapper from './AuthWrapper';
import checkpointLogin from '@/api/auth/checkpointLogin';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/elements/Toast';

export default () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { auth, setUser } = useUserStore();

  useEffect(() => {
    if (!auth.token) {
      navigate('/auth/login');
    }
  }, []);

  const [faToken, setFaToken] = useState('');

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();

    checkpointLogin({ code: faToken, confirmation_token: auth.token! })
      .then(response => {
        setUser(response.user!);
        navigate('/');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <AuthWrapper title="Two Factor Authentication">
      <form onSubmit={submitLogin}>
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
