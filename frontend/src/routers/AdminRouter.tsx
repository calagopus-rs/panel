import { faReply } from '@fortawesome/free-solid-svg-icons';
import { NavLink, Route, Routes } from 'react-router';
import Container from '@/elements/Container';
import Sidebar from '@/elements/Sidebar';
import { to } from '@/lib/routes';
import NotFound from '@/pages/NotFound';
import adminRoutes from '@/routers/routes/adminRoutes';
import { useGlobalStore } from '@/stores/global';

export default () => {
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
          .filter((route) => !!route.name)
          .map((route) => (
            <Sidebar.Link
              key={route.path}
              to={to(route.path, '/admin')}
              end={route.exact}
              icon={route.icon}
              name={route.name}
            />
          ))}

        <Sidebar.Footer />
      </Sidebar>
      <div id={'admin-root'} className={'max-w-[100vw] lg:max-w-[calc(100vw-17.5rem)] flex-1 lg:ml-0'}>
        <Container>
          <Routes>
            {adminRoutes.map(({ path, element: Element }) => (
              <Route key={path} path={path} element={<Element />} />
            ))}
            <Route path={'*'} element={<NotFound />} />
          </Routes>
        </Container>
      </div>
    </div>
  );
};
