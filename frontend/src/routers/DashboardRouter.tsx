import Sidebar from '@/elements/sidebar/Sidebar';
import DashboardHome from '@/pages/dashboard/home/DashboardHome';
import { NavLink, Route, Routes } from 'react-router';
import classNames from 'classnames';
import styles from '@/elements/sidebar/sidebar.module.css';
import NotFound from '@/pages/NotFound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faMagnifyingGlass, faServer } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/providers/AuthProvider';
import routes, { to } from './routes';
import Container from '@/elements/Container';
import { useGlobalStore } from '@/stores/global';

export default () => {
  const { user } = useAuth();
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
          <a className={classNames(styles.navLink, 'cursor-pointer')}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <span>Search</span>
          </a>
          <Sidebar.Link to={'/'} end>
            <FontAwesomeIcon icon={faServer} />
            <span>Servers</span>
          </Sidebar.Link>
          {user.admin && (
            <Sidebar.Link to={'/admin'} end>
              <FontAwesomeIcon icon={faGraduationCap} />
              <span>Admin</span>
            </Sidebar.Link>
          )}
        </Sidebar.Section>
        <Sidebar.Section>
          {routes.account
            .filter((route) => !!route.name)
            .map((route) => (
              <Sidebar.Link key={route.path} to={to(route.path, '/account')} end={route.exact}>
                <FontAwesomeIcon icon={route.icon} />
                <span>{route.name}</span>
              </Sidebar.Link>
            ))}
        </Sidebar.Section>
        <Sidebar.User />
      </Sidebar>
      <div id={'dashboard-root'} className={'max-w-[100vw] lg:max-w-[calc(100vw-17.5rem)] flex-1 lg:ml-0'}>
        <Container>
          <Routes>
            <Route path={''} element={<DashboardHome />} />
            {routes.account.map(({ path, element: Element }) => (
              <Route key={path} path={`/account/${path}`.replace('//', '/')} element={<Element />} />
            ))}
            <Route path={'*'} element={<NotFound />} />
          </Routes>
        </Container>
      </div>
    </div>
  );
};
