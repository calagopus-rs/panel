import logout from '@/api/me/logout';
import { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import login from '@/api/auth/login';
import { useGlobalStore } from '@/stores/global';
import { useNavigate } from 'react-router';
import register from '@/api/auth/register';
import checkpointLogin from '@/api/auth/checkpointLogin';
import getMe from '@/api/me/getMe';
import Spinner from '@/elements/Spinner';

interface AuthContextType {
  user: User | null;

  setUser: (user: User | null) => void;
  doLogin: (username: string, password: string) => void;
  doCheckpointLogin: (faToken: string, twoFactorToken: string) => void;
  doRegister: (username: string, email: string, nameFirst: string, nameLast: string, password: string) => void;
  doLogout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { setTwoFactorToken } = useGlobalStore();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getMe()
      .then(user => setUser(user))
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const doLogin = (username: string, password: string) => {
    login({ user: username, password })
      .then(response => {
        if (response.type === 'two_factor_required') {
          setTwoFactorToken(response.token!);
          navigate('/auth/two-factor');
          return;
        }

        setUser(response.user!);
        navigate('/');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doCheckpointLogin = (faToken: string, twoFactorToken: string) => {
    checkpointLogin({ code: faToken, confirmation_token: twoFactorToken })
      .then(response => {
        setUser(response.user!);
        navigate('/');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doRegister = (username: string, email: string, nameFirst: string, nameLast: string, password: string) => {
    register({ username, email, name_first: nameFirst, name_last: nameLast, password })
      .then(response => {
        setUser(response.user!);
        navigate('/');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doLogout = () => {
    logout()
      .then(() => {
        setUser(null);
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, doLogin, doCheckpointLogin, doRegister, doLogout }}>
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
