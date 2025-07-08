import ForgotPassword from '@/pages/auth/ForgotPassword';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ResetPassword from '@/pages/auth/ResetPassword';
import TwoFactor from '@/pages/auth/TwoFactor';
import NotFound from '@/pages/NotFound';
import { Route, Routes } from 'react-router';

export default () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/two-factor" element={<TwoFactor />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};
