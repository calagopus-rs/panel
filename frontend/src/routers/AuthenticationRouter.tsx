import Login from '@/pages/auth/Login';
import { Route, Routes } from 'react-router';

export default () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
};
