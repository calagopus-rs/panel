import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useRef, useState } from 'react';
import { NavLink } from 'react-router';
import AuthWrapper from './AuthWrapper';
import forgotPassword from '@/api/auth/forgotPassword';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import Captcha from '@/elements/Captcha';

export default () => {
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [requested, setRequested] = useState(false);
  const captchaRef = useRef(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    captchaRef.current?.getToken().then((token) => {
      forgotPassword(email, token)
        .then(() => {
          addToast('An email has been sent to you with instructions on how to reset your password.', 'success');
          setRequested(true);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    });
  };

  return (
    <AuthWrapper title={'Forgot Password'}>
      <form onSubmit={submit}>
        <div className={'mb-4'}>
          <Input.Text
            id={'email'}
            variant={Input.Text.Variants.Loose}
            placeholder={'Email'}
            type={'email'}
            className={'bg-gray-700!'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className={'mb-4'}>
          <Captcha ref={captchaRef} />
        </div>
        <Button type={'submit'} className={'w-full'} disabled={requested}>
          Request Password Reset
        </Button>
      </form>
      <div className={'mt-4'}>
        <p className={'text-sm text-gray-400'}>
          <NavLink to={'/auth/login'} className={'text-cyan-200 hover:underline'}>
            Remembered your password?
          </NavLink>
        </p>
      </div>
    </AuthWrapper>
  );
};
