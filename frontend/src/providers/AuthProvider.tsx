import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { httpErrorToHuman } from '@/api/axios.ts';
import getMe from '@/api/me/getMe.ts';
import logout from '@/api/me/logout.ts';
import Spinner from '@/elements/Spinner.tsx';
import { useToast } from './ToastProvider.tsx';
import { useTranslations } from './TranslationProvider.tsx';

interface AuthContextType {
  user: User | null;

  setUser: (user: User | null) => void;
  doLogin: (user: User, doNavigate?: boolean) => void;
  doLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { setToastPosition, addToast } = useToast();
  const { setLanguage } = useTranslations();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (user) {
      setToastPosition(user.toastPosition);
      setLanguage(user.language);
    }
  }, [user, setToastPosition, setLanguage]);

  useEffect(() => {
    getMe()
      .then((user) => setUser(user))
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const doLogin = (user: User, doNavigate: boolean = true) => {
    setUser(user);
    if (doNavigate) {
      navigate('/');
    }
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
