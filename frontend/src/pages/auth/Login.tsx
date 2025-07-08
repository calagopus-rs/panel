import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useRef, useState } from 'react';
import { NavLink } from 'react-router';
import AuthWrapper from './AuthWrapper';
import { useAuth } from '@/providers/AuthProvider';
import Captcha from '@/elements/Captcha';

export default () => {
  const { doLogin } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const captchaRef = useRef(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    captchaRef.current?.getToken().then(token => {
      doLogin(username, password, token);
    });
  };

  return (
    <AuthWrapper title="Login">
      <form onSubmit={submit}>
        <div className="mb-4">
          <Input.Text
            id="username"
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
        <div className="mb-4">
          <Captcha ref={captchaRef} />
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
      <div className="mt-4">
        <p className="text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <NavLink to="/auth/register" className="text-cyan-200 hover:underline">
            Register
          </NavLink>
        </p>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-400">
          <NavLink to="/auth/forgot-password" className="text-cyan-200 hover:underline">
            Forgot your password?
          </NavLink>
        </p>
      </div>
    </AuthWrapper>
  );
};
