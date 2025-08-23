import { useRef, useState } from 'react';
import { NavLink } from 'react-router';
import AuthWrapper from './AuthWrapper';
import { useAuth } from '@/providers/AuthProvider';
import Captcha from '@/elements/Captcha';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';

export default () => {
  const { doLogin } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const captchaRef = useRef(null);

  const submit = () => {
    captchaRef.current?.getToken().then((token) => {
      doLogin(username, password, token);
    });
  };

  return (
    <AuthWrapper title={'Login'}>
      <div>
        <TextInput placeholder={'Username'} value={username} onChange={(e) => setUsername(e.target.value)} />
        <TextInput
          placeholder={'Password'}
          type={'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          mt={'sm'}
        />

        <div className={'mb-4'}>
          <Captcha ref={captchaRef} />
        </div>
        <Button fullWidth onClick={submit}>
          Login
        </Button>
      </div>

      <div className={'mt-4'}>
        <p className={'text-sm text-gray-400'}>
          Don&apos;t have an account?{' '}
          <NavLink to={'/auth/register'} className={'text-cyan-200 hover:underline'}>
            Register
          </NavLink>
        </p>
      </div>
      <div className={'mt-4'}>
        <p className={'text-sm text-gray-400'}>
          <NavLink to={'/auth/forgot-password'} className={'text-cyan-200 hover:underline'}>
            Forgot your password?
          </NavLink>
        </p>
      </div>
    </AuthWrapper>
  );
};
