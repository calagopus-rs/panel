import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useUserStore } from '@/stores/user';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import AuthWrapper from './AuthWrapper';
import { useToast } from '@/elements/Toast';
import { httpErrorToHuman } from '@/api/axios';
import register from '@/api/auth/register';

export default () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { setUser, setAuthToken } = useUserStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [nameFirst, setNameFirst] = useState('');
  const [nameLast, setNameLast] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    register({ username, email, name_first: nameFirst, name_last: nameLast, password })
      .then(response => {
        setUser(response.user!);
        navigate('/');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <AuthWrapper title="Register">
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
            placeholder="Email"
            type="email"
            className="bg-gray-700!"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <Input.Text
            variant={Input.Text.Variants.Loose}
            placeholder="First Name"
            type="text"
            className="bg-gray-700!"
            value={nameFirst}
            onChange={e => setNameFirst(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <Input.Text
            variant={Input.Text.Variants.Loose}
            placeholder="Last Name"
            type="text"
            className="bg-gray-700!"
            value={nameLast}
            onChange={e => setNameLast(e.target.value)}
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
          Already have an account?{' '}
          <NavLink to={'/auth/login'} className="text-cyan-200 hover:underline">
            Login
          </NavLink>
        </p>
      </div>
    </AuthWrapper>
  );
};
