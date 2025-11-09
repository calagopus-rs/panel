import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { httpErrorToHuman } from '@/api/axios';
import getMe from '@/api/me/getMe';
import logout from '@/api/me/logout';
import Spinner from '@/elements/Spinner';
import { load } from '@/lib/debounce';
import { useToast } from './ToastProvider';

interface AuthContextType {
  user: User | null;

  setUser: (user: User | null) => void;
  doLogin: (user: User) => void;
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
    <AuthContext.Provider value={{ user, setUser, doLogin, doLogout }}>
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
