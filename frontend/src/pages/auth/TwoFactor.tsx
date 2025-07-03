import login from '@/api/auth/login';
import minecraftBackground from '@/assets/minecraft_background.png';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useUserStore } from '@/stores/user';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export default () => {
  const navigate = useNavigate();
  const { setUser, setAuthToken } = useUserStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();

    login({ user: username, password }).then(response => {
      if (response.type === 'two_factor_required') {
        setAuthToken(response.token!);
        navigate('/auth/two-factor');
        return;
      }

      setUser(response.user!);
      navigate('/');
    });
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 h-full">
        <img src={minecraftBackground} alt="Minecraft Background" className="w-full h-full object-cover" />
      </div>
      <div className="w-1/2 h-full">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-3xl font-bold text-white mb-4">Login</h1>
          <form onSubmit={submitLogin}>
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
              <a href="/auth/register" className="text-cyan-200 hover:underline">
                Register
              </a>
            </p>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">
              <a href="/auth/forgot-password" className="text-cyan-200 hover:underline">
                Forgot your password?
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
