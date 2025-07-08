import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import AuthWrapper from './AuthWrapper';
import forgotPassword from '@/api/auth/forgotPassword';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import resetPassword from '@/api/auth/resetPassword';

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    resetPassword(token, password)
      .then(() => {
        addToast('Password has been reset.', 'success');
        navigate('/auth/login');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <AuthWrapper title="Reset Password">
      <form onSubmit={submit}>
        <div className="mb-4">
          <Input.Text
            id="password"
            variant={Input.Text.Variants.Loose}
            placeholder="Password"
            type="password"
            className="bg-gray-700!"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <Input.Text
            variant={Input.Text.Variants.Loose}
            placeholder="Confirm Password"
            type="password"
            className="bg-gray-700!"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={password !== confirmPassword}>
          Reset Password
        </Button>
      </form>
    </AuthWrapper>
  );
};
