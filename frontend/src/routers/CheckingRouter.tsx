import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useUserStore } from '@/stores/user';
import getMe from '@/api/me/getMe';
import Spinner from '@/elements/Spinner';

interface Props {
  requireAuthenticated?: boolean;
  requireUnauthenticated?: boolean;
  children: React.ReactNode;
}

export default ({ requireAuthenticated, requireUnauthenticated, children }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(user => setUser(user))
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (user === undefined) return;

    if (requireAuthenticated && !user?.id) {
      navigate('/auth/login', { state: { from: location } });
      return;
    }
    if (requireUnauthenticated && user?.id) {
      navigate('/', { state: { from: location } });
      return;
    }

    setLoading(false);
  }, [user]);

  return loading || (requireAuthenticated && !user) ? <Spinner.Centered /> : <>{children}</>;
};
