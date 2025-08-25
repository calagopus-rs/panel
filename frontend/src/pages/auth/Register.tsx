import { useRef, useState } from 'react';
import { NavLink } from 'react-router';
import AuthWrapper from './AuthWrapper';
import { useAuth } from '@/providers/AuthProvider';
import Captcha from '@/elements/Captcha';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { Stack } from '@mantine/core';

export default () => {
  const { doRegister } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [nameFirst, setNameFirst] = useState('');
  const [nameLast, setNameLast] = useState('');
  const [password, setPassword] = useState('');
  const captchaRef = useRef(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    doRegister(username, email, nameFirst, nameLast, password);
  };

  return (
    <AuthWrapper title={'Register'}>
      <Stack>
        <TextInput placeholder={'Username'} value={username} onChange={(e) => setUsername(e.target.value)} />
        <TextInput placeholder={'Email'} value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextInput placeholder={'First Name'} value={nameFirst} onChange={(e) => setNameFirst(e.target.value)} />
        <TextInput placeholder={'Last Name'} value={nameLast} onChange={(e) => setNameLast(e.target.value)} />
        <TextInput
          placeholder={'Password'}
          type={'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Captcha ref={captchaRef} />
        <Button fullWidth onClick={submit}>
          Register
        </Button>
      </Stack>
      <div className={'mt-4'}>
        <p className={'text-sm text-gray-400'}>
          Already have an account?{' '}
          <NavLink to={'/auth/login'} className={'text-cyan-200 hover:underline'}>
            Login
          </NavLink>
        </p>
      </div>
    </AuthWrapper>
  );
};
