import minecraftBackground from '@/assets/minecraft_background.png';
import { Input } from '@/elements/inputs';
import { useNavigate } from 'react-router';

export default () => {
  const navigate = useNavigate();

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 h-full">
        <img src={minecraftBackground} alt="Minecraft Background" className="w-full h-full object-cover" />
      </div>
      <div className="w-1/2 h-full">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-3xl font-bold text-white">Login</h1>
          <form className="mt-4" onSubmit={submitLogin}>
            <div className="mb-4">
              <Input.Text id={'username'} variant={Input.Text.Variants.Loose} placeholder="Username" type="text" />
            </div>
            <div className="mb-4">
              <Input.Text variant={Input.Text.Variants.Loose} placeholder="Password" type="password" />
            </div>
            <button type="submit" className="px-4 py-2 w-full rounded-md bg-blue-500 text-white">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
