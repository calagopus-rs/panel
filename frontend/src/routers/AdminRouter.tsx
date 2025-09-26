import Sidebar from '@/elements/sidebar/Sidebar';
import { NavLink, Route, Routes } from 'react-router';
import NotFound from '@/pages/NotFound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReply } from '@fortawesome/free-solid-svg-icons';
import routes, { to } from './routes';
import Container from '@/elements/Container';
import { useGlobalStore } from '@/stores/global';

export default () => {
  const { settings } = useGlobalStore();

  return (
    <div className={'lg:flex'}>
      <Sidebar collapsed={false}>
        <NavLink to={'/'} className={'w-full'}>
          <div className={'h-28 w-full p-4 flex flex-row items-center justify-between mt-1 select-none cursor-pointer'}>
            <img src={'/icon.svg'} className={'h-full'} alt={'Calagopus Icon'} />
            <h1 className={'grow font-logo text-xl'}>{settings.app.name}</h1>
          </div>
        </NavLink>
        <Sidebar.Section>
          <Sidebar.Link to={'/'} end>
            <FontAwesomeIcon icon={faReply} />
            <span>Back</span>
          </Sidebar.Link>
        </Sidebar.Section>
        <Sidebar.Section>
          {routes.admin
            .filter((route) => !!route.name)
            .map((route) => (
              <Sidebar.Link key={route.path} to={to(route.path, '/admin')} end={route.exact}>
                <FontAwesomeIcon icon={route.icon} />
                <span>{route.name}</span>
              </Sidebar.Link>
            ))}
        </Sidebar.Section>
        <Sidebar.User />
      </Sidebar>
      <div id={'admin-root'} className={'max-w-[100vw] lg:max-w-[calc(100vw-17.5rem)] flex-1 lg:ml-0'}>
        <Container>
          <Routes>
            {routes.admin.map(({ path, element: Element }) => (
              <Route key={path} path={path} element={<Element />} />
            ))}
            <Route path={'*'} element={<NotFound />} />
          </Routes>
        </Container>
      </div>
    </div>
  );
};
