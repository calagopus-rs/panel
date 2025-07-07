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
    if (!user) return;

    setLoading(false);
  }, [user]);

  return loading || !user ? <Spinner.Centered /> : <>{children}</>;
};
