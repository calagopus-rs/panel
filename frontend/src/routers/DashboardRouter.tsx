import Sidebar from '@/elements/sidebar/Sidebar';
import DashboardHome from '@/pages/dashboard/home/DashboardHome';
import { Route, Routes } from 'react-router';
import CollapsedIcon from '@/assets/pterodactyl.svg';
import classNames from 'classnames';
import styles from '@/elements/sidebar/sidebar.module.css';
import NotFound from '@/pages/NotFound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faMagnifyingGlass, faServer } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/providers/AuthProvider';
import routes, { to } from './routes';
import ErrorBoundary from '@/elements/ErrorBoundary';

export default () => {
  const { user } = useAuth();

  return (
    <div className={'lg:flex'}>
      <Sidebar collapsed={false}>
        <div className={'h-fit w-full flex flex-col items-center justify-center mt-1 select-none cursor-pointer'}>
          <img src={CollapsedIcon} className={'my-4 h-20'} alt={'Pterodactyl Icon'} />
        </div>
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
      <div className={'max-w-[100vw] lg:max-w-[calc(100vw-17.5rem)] flex-1 lg:ml-0'}>
        <ErrorBoundary>
          <Routes>
            <Route path={''} element={<DashboardHome />} />
            {routes.account.map(({ path, element: Element }) => (
              <Route key={path} path={path} element={<Element />} />
            ))}
            <Route path={'*'} element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </div>
  );
};
