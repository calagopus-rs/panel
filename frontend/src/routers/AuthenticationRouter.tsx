import { Route, Routes } from 'react-router';
import NotFound from '@/pages/NotFound';
import authenticationRoutes from '@/routers/routes/authenticationRoutes';

export default function AuthenticationRouter() {
  return (
    <Routes>
      {authenticationRoutes
        .filter((route) => !route.filter || route.filter())
        .map(({ path, element: Element }) => (
          <Route key={path} path={path} element={<Element />} />
        ))}
      {window.extensionContext.routes.authenticationRoutes
        .filter((route) => !route.filter || route.filter())
        .map(({ path, element: Element }) => (
          <Route key={path} path={path} element={<Element />} />
        ))}
      <Route path={'*'} element={<NotFound />} />
    </Routes>
  );
}
