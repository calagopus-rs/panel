import Sidebar from '@/elements/sidebar/Sidebar';
import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useParams } from 'react-router';
import classNames from 'classnames';
import styles from '@/elements/sidebar/sidebar.module.css';
import NotFound from '@/pages/NotFound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faMagnifyingGlass, faServer } from '@fortawesome/free-solid-svg-icons';
import { useServerStore } from '@/stores/server';
import Spinner from '@/elements/Spinner';
import WebsocketHandler from '@/pages/server/WebsocketHandler';
import WebsocketListener from '@/pages/server/WebsocketListener';
import getServer from '@/api/server/getServer';
import routes, { to } from './routes';
import Can from '@/elements/Can';
import Container from '@/elements/Container';
import { load } from '@/lib/debounce';
import Notification from '@/elements/Notification';
import Progress from '@/elements/Progress';
import { useAuth } from '@/providers/AuthProvider';
import { useGlobalStore } from '@/stores/global';

export default () => {
  const params = useParams<'id'>();
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const { settings } = useGlobalStore();
  const { server, backupRestoreProgress } = useServerStore();
  const resetState = useServerStore((state) => state.reset);
  const setServer = useServerStore((state) => state.setServer);

  useEffect(() => {
    return () => {
      resetState();
    };
  }, []);

  useEffect(() => {
    getServer(params.id)
      .then((data) => setServer(data))
      .finally(() => load(false, setLoading));
  }, [params.id]);

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
            <Sidebar.Link to={`/admin/servers/${params.id}`} end>
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              <span>View admin</span>
            </Sidebar.Link>
          )}
        </Sidebar.Section>
        <Sidebar.Section>
          {routes.server
            .filter((route) => !!route.name)
            .map((route) =>
              route.permission ? (
                <Can key={route.path} action={route.permission} matchAny>
                  <Sidebar.Link to={to(route.path, `/server/${params.id}`)} end={route.exact}>
                    <FontAwesomeIcon icon={route.icon} />
                    <span>{route.name}</span>
                  </Sidebar.Link>
                </Can>
              ) : (
                <Sidebar.Link key={route.path} to={to(route.path, `/server/${params.id}`)} end={route.exact}>
                  <FontAwesomeIcon icon={route.icon} />
                  <span>{route.name}</span>
                </Sidebar.Link>
              ),
            )}
        </Sidebar.Section>
        <Sidebar.User />
      </Sidebar>
      <div id={'server-root'} className={'max-w-[100vw] lg:max-w-[calc(100vw-17.5rem)] flex-1 lg:ml-0'}>
        {loading ? (
          <Container>
            <div className={'w-full h-[90vh] flex items-center justify-center'}>
              <Spinner size={75} />
            </div>
          </Container>
        ) : server ? (
          <>
            <WebsocketHandler />
            <WebsocketListener />

            <Container>
              {server.status === 'restoring_backup' ? (
                <Notification className={'mb-4'} loading>
                  Your Server is currently restoring from a backup. Please wait...
                  <Progress value={backupRestoreProgress} />
                </Notification>
              ) : server.status === 'installing' ? (
                <Notification className={'mb-4'} loading>
                  Your Server is currently being installed. Please wait...
                </Notification>
              ) : null}

              <Routes>
                {routes.server.map(({ path, element: Element }) => (
                  <Route key={path} path={path} element={<Element />} />
                ))}
                <Route path={'*'} element={<NotFound />} />
              </Routes>
            </Container>
          </>
        ) : (
          <NotFound />
        )}
      </div>
    </div>
  );
};
