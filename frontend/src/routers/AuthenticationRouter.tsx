import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import TwoFactor from '@/pages/auth/TwoFactor';
import NotFound from '@/pages/NotFound';
import { useUserStore } from '@/stores/user';
import { Route, Routes, useNavigate } from 'react-router';

export default () => {
  const navigate = useNavigate();
  const { user } = useUserStore();

  if (user?.id) {
    navigate('/');
    return;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<Login />} />
        <Route path="/two-factor" element={<TwoFactor />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};
