import Login from '@/pages/auth/Login';
import { Route, Routes } from 'react-router';

export default function AuthenticationRouter() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}
