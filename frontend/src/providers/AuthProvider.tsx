import logout from '@/api/me/logout';
import { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { useNavigate } from 'react-router';
import register from '@/api/auth/register';
import getMe from '@/api/me/getMe';
import Spinner from '@/elements/Spinner';
import { load } from '@/lib/debounce';

interface AuthContextType {
  user: User | null;

  setUser: (user: User | null) => void;
  doLogin: (user: User) => void;
  doRegister: (username: string, email: string, nameFirst: string, nameLast: string, password: string) => void;
  doLogout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getMe()
      .then((user) => setUser(user))
      .catch(() => {
        setUser(null);
      })
      .finally(() => load(false, setLoading));
  }, []);

  const doLogin = (user: User) => {
    setUser(user);
    navigate('/');
  };

  const doRegister = (username: string, email: string, nameFirst: string, nameLast: string, password: string) => {
    register({ username, email, name_first: nameFirst, name_last: nameLast, password })
      .then((response) => {
        setUser(response.user!);
        navigate('/');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doLogout = () => {
    logout()
      .then(() => {
        setUser(null);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, doLogin, doRegister, doLogout }}>
      {loading ? <Spinner.Centered /> : children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
