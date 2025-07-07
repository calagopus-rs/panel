import login from '@/api/auth/login';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useUserStore } from '@/stores/user';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import AuthWrapper from './AuthWrapper';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { useGlobalStore } from '@/stores/global';

export default () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { setUser } = useUserStore();
  const { setTwoFactorToken } = useGlobalStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    login({ user: username, password })
      .then(response => {
        if (response.type === 'two_factor_required') {
          setTwoFactorToken(response.token!);
          navigate('/auth/two-factor');
          return;
        }

        setUser(response.user!);
        navigate('/');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <AuthWrapper title="Login">
      <form onSubmit={submit}>
        <div className="mb-4">
          <Input.Text
            id={'username'}
            variant={Input.Text.Variants.Loose}
            placeholder="Username"
            type="text"
            className="bg-gray-700!"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <Input.Text
            variant={Input.Text.Variants.Loose}
            placeholder="Password"
            type="password"
            className="bg-gray-700!"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
      <div className="mt-4">
        <p className="text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <NavLink to={'/auth/register'} className="text-cyan-200 hover:underline">
            Register
          </NavLink>
        </p>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-400">
          <NavLink to={'/auth/forgot-password'} className="text-cyan-200 hover:underline">
            Forgot your password?
          </NavLink>
        </p>
      </div>
    </AuthWrapper>
  );
};
