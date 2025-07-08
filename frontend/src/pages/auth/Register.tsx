import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useState } from 'react';
import { NavLink } from 'react-router';
import AuthWrapper from './AuthWrapper';
import { useAuth } from '@/providers/AuthProvider';

export default () => {
  const { doRegister } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [nameFirst, setNameFirst] = useState('');
  const [nameLast, setNameLast] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    doRegister(username, email, nameFirst, nameLast, password);
  };

  return (
    <AuthWrapper title="Register">
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
          Register
        </Button>
      </form>
      <div className="mt-4">
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <NavLink to="/auth/login" className="text-cyan-200 hover:underline">
            Login
          </NavLink>
        </p>
      </div>
    </AuthWrapper>
  );
};
