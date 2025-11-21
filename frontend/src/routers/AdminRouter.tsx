import { faReply } from '@fortawesome/free-solid-svg-icons';
import { Suspense } from 'react';
import { NavLink, Route, Routes } from 'react-router';
import Container from '@/elements/Container';
import Sidebar from '@/elements/Sidebar';
import Spinner from '@/elements/Spinner';
import { to } from '@/lib/routes';
import NotFound from '@/pages/NotFound';
import adminRoutes from '@/routers/routes/adminRoutes';
import { useGlobalStore } from '@/stores/global';
import Can from '@/elements/Can';

export default function AdminRouter() {
  const { settings } = useGlobalStore();

  return (
    <div className={'lg:flex'}>
      <Sidebar>
        <NavLink to={'/'} className={'w-full'}>
          <div className={'h-28 w-full flex flex-row items-center justify-between mt-1 select-none cursor-pointer'}>
            <img src={'/icon.svg'} className={'h-full py-4'} alt={'Calagopus Icon'} />
            <h1 className={'grow font-logo text-xl'}>{settings.app.name}</h1>
          </div>
        </NavLink>

        <Sidebar.Divider />

        <Sidebar.Link to={'/'} end icon={faReply} name={'Back'} />

        <Sidebar.Divider />

        {adminRoutes
          .filter((route) => !!route.name && (!route.filter || route.filter()))
          .map((route) =>
            route.permission ? (
              <Can key={route.path} action={route.permission} matchAny>
                <Sidebar.Link
                  key={route.path}
                  to={to(route.path, '/admin')}
                  end={route.exact}
                  icon={route.icon}
                  name={route.name}
                />
              </Can>
            ) : (
              <Sidebar.Link
                key={route.path}
                to={to(route.path, '/admin')}
                end={route.exact}
                icon={route.icon}
                name={route.name}
              />
            ),
          )}
        {window.extensionContext.routes.adminRoutes
          .filter((route) => !!route.name && (!route.filter || route.filter()))
          .map((route) =>
            route.permission ? (
              <Can key={route.path} action={route.permission} matchAny>
                <Sidebar.Link
                  key={route.path}
                  to={to(route.path, '/admin')}
                  end={route.exact}
                  icon={route.icon}
                  name={route.name}
                />
              </Can>
            ) : (
              <Sidebar.Link
                key={route.path}
                to={to(route.path, '/admin')}
                end={route.exact}
                icon={route.icon}
                name={route.name}
              />
            ),
          )}

        <Sidebar.Footer />
      </Sidebar>
      <div id={'admin-root'} className={'max-w-[100vw] lg:max-w-[calc(100vw-17.5rem)] flex-1 lg:ml-0'}>
        <Container>
          <Suspense fallback={<Spinner.Centered />}>
            <Routes>
              {adminRoutes
                .filter((route) => !route.filter || route.filter())
                .map(({ path, element: Element }) => (
                  <Route key={path} path={path} element={<Element />} />
                ))}
              {window.extensionContext.routes.adminRoutes
                .filter((route) => !route.filter || route.filter())
                .map(({ path, element: Element }) => (
                  <Route key={path} path={path} element={<Element />} />
                ))}
              <Route path={'*'} element={<NotFound />} />
            </Routes>
          </Suspense>
        </Container>
      </div>
    </div>
  );
}
