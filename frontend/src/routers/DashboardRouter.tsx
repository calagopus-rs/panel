import { faGraduationCap, faServer } from '@fortawesome/free-solid-svg-icons';
import { Suspense } from 'react';
import { NavLink, Route, Routes } from 'react-router';
import Container from '@/elements/Container';
import Sidebar from '@/elements/Sidebar';
import Spinner from '@/elements/Spinner';
import { to } from '@/lib/routes';
import DashboardHome from '@/pages/dashboard/home/DashboardHome';
import DashboardHomeAll from '@/pages/dashboard/home/DashboardHomeAll';
import NotFound from '@/pages/NotFound';
import { useAuth } from '@/providers/AuthProvider';
import accountRoutes from '@/routers/routes/accountRoutes';
import { useGlobalStore } from '@/stores/global';

export default function DashboardRouter() {
  const { user } = useAuth();
  const { settings } = useGlobalStore();

  return (
    <div className='lg:flex'>
      <Sidebar>
        <NavLink to='/' className='w-full'>
          <div className='h-28 w-full flex flex-row items-center justify-between mt-1 select-none cursor-pointer'>
            <img src='/icon.svg' className='h-full py-4' alt='Calagopus Icon' />
            <h1 className='grow font-logo text-xl'>{settings.app.name}</h1>
          </div>
        </NavLink>

        <Sidebar.Divider />

        <Sidebar.Link to='/' end icon={faServer} name='Servers' />
        {user.admin && <Sidebar.Link to='/admin' end icon={faGraduationCap} name='Admin' />}

        <Sidebar.Divider />

        {accountRoutes
          .filter((route) => !!route.name && (!route.filter || route.filter()))
          .map((route) => (
            <Sidebar.Link
              key={route.path}
              to={to(route.path, '/account')}
              end={route.exact}
              icon={route.icon}
              name={route.name}
            />
          ))}
        {window.extensionContext.routes.accountRoutes
          .filter((route) => !!route.name && (!route.filter || route.filter()))
          .map((route) => (
            <Sidebar.Link
              key={route.path}
              to={to(route.path, '/account')}
              end={route.exact}
              icon={route.icon}
              name={route.name}
            />
          ))}

        <Sidebar.Footer />
      </Sidebar>
      <div id='dashboard-root' className='max-w-[100vw] lg:max-w-[calc(100vw-17.5rem)] flex-1 lg:ml-0'>
        <Container>
          <Suspense fallback={<Spinner.Centered />}>
            <Routes>
              <Route path='' element={<DashboardHome />} />
              <Route path='/all' element={<DashboardHomeAll />} />
              {accountRoutes
                .filter((route) => !route.filter || route.filter())
                .map(({ path, element: Element }) => (
                  <Route key={path} path={`/account/${path}`.replace('//', '/')} element={<Element />} />
                ))}
              {window.extensionContext.routes.accountRoutes
                .filter((route) => !route.filter || route.filter())
                .map(({ path, element: Element }) => (
                  <Route key={path} path={`/account/${path}`.replace('//', '/')} element={<Element />} />
                ))}
              <Route path='*' element={<NotFound />} />
            </Routes>
          </Suspense>
        </Container>
      </div>
    </div>
  );
}
