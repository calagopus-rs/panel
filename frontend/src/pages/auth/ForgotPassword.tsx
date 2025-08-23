import { useRef, useState } from 'react';
import { NavLink } from 'react-router';
import AuthWrapper from './AuthWrapper';
import forgotPassword from '@/api/auth/forgotPassword';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import Captcha from '@/elements/Captcha';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';

export default () => {
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [requested, setRequested] = useState(false);
  const captchaRef = useRef(null);

  const submit = () => {
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
      <div>
        <TextInput placeholder={'Email'} value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className={'mb-4'}>
          <Captcha ref={captchaRef} />
        </div>
        <Button fullWidth onClick={submit} disabled={requested}>
          Request Password Reset
        </Button>
      </div>

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
