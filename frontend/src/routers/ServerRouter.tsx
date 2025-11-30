import { faArrowUpRightFromSquare, faCancel, faServer } from '@fortawesome/free-solid-svg-icons';
import { Suspense, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useParams } from 'react-router';
import getServer from '@/api/server/getServer';
import Can from '@/elements/Can';
import Container from '@/elements/Container';
import Notification from '@/elements/Notification';
import Progress from '@/elements/Progress';
import Sidebar from '@/elements/Sidebar';
import Spinner from '@/elements/Spinner';
import { to } from '@/lib/routes';
import NotFound from '@/pages/NotFound';
import WebsocketHandler from '@/pages/server/WebsocketHandler';
import WebsocketListener from '@/pages/server/WebsocketListener';
import { useAuth } from '@/providers/AuthProvider';
import serverRoutes from '@/routers/routes/serverRoutes';
import { useGlobalStore } from '@/stores/global';
import { useServerStore } from '@/stores/server';
import Button from '@/elements/Button';
import cancelServerInstall from '@/api/server/settings/cancelServerInstall';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function ServerRouter({ isNormal }: { isNormal: boolean }) {
  const params = useParams<'id'>();
  const [loading, setLoading] = useState(true);
  const [abortLoading, setAbortLoading] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();

  const { settings } = useGlobalStore();
  const { server, updateServer, backupRestoreProgress } = useServerStore();
  const resetState = useServerStore((state) => state.reset);
  const setServer = useServerStore((state) => state.setServer);

  useEffect(() => {
    return () => {
      resetState();
    };
  }, []);

  useEffect(() => {
    if (!server?.status && abortLoading) {
      addToast('Server reinstall aborted.', 'success');
      setAbortLoading(false);
    }
  }, [abortLoading, server?.status]);

  useEffect(() => {
    getServer(params.id)
      .then((data) => setServer(data))
      .finally(() => setLoading(false));
  }, [params.id]);

  const doAbortInstall = () => {
    setAbortLoading(true);

    cancelServerInstall(server.uuid)
      .then((instantCancel) => {
        if (instantCancel) {
          updateServer({ status: null });
        }
      })
      .catch((err) => addToast(httpErrorToHuman(err), 'error'));
  };

  return (
    <div className='lg:flex'>
      {isNormal && (
        <Sidebar>
          <NavLink to='/' className='w-full'>
            <div className='h-28 w-full flex flex-row items-center justify-between mt-1 select-none cursor-pointer'>
              <img src='/icon.svg' className='h-full py-4' alt='Calagopus Icon' />
              <h1 className='grow font-logo text-xl'>{settings.app.name}</h1>
            </div>
          </NavLink>

          <Sidebar.Divider />

          <Sidebar.Link to='/' end icon={faServer} name='Servers' />
          {user.admin && (
            <Sidebar.Link to={`/admin/servers/${params.id}`} end icon={faArrowUpRightFromSquare} name='View admin' />
          )}

          <Sidebar.Divider />

          {serverRoutes
            .filter((route) => !!route.name && (!route.filter || route.filter()))
            .map((route) =>
              route.permission ? (
                <Can key={route.path} action={route.permission} matchAny>
                  <Sidebar.Link
                    to={to(route.path, `/server/${params.id}`)}
                    end={route.exact}
                    icon={route.icon}
                    name={route.name}
                  />
                </Can>
              ) : (
                <Sidebar.Link
                  key={route.path}
                  to={to(route.path, `/server/${params.id}`)}
                  end={route.exact}
                  icon={route.icon}
                  name={route.name}
                />
              ),
            )}
          {window.extensionContext.routes.serverRoutes
            .filter((route) => !!route.name && (!route.filter || route.filter()))
            .map((route) =>
              route.permission ? (
                <Can key={route.path} action={route.permission} matchAny>
                  <Sidebar.Link
                    to={to(route.path, `/server/${params.id}`)}
                    end={route.exact}
                    icon={route.icon}
                    name={route.name}
                  />
                </Can>
              ) : (
                <Sidebar.Link
                  key={route.path}
                  to={to(route.path, `/server/${params.id}`)}
                  end={route.exact}
                  icon={route.icon}
                  name={route.name}
                />
              ),
            )}

          <Sidebar.Footer />
        </Sidebar>
      )}

      <div
        id='server-root'
        className={isNormal ? 'max-w-[100vw] lg:max-w-[calc(100vw-17.5rem)] flex-1 lg:ml-0' : 'flex-1 lg:ml-0'}
      >
        <Container isNormal={isNormal}>
          {loading ? (
            <Spinner.Centered />
          ) : server ? (
            <>
              <WebsocketHandler />
              <WebsocketListener />
              {server.status === 'restoring_backup' ? (
                <Notification className='mb-4' loading>
                  Your Server is currently restoring from a backup. Please wait...
                  <Progress value={backupRestoreProgress} />
                </Notification>
              ) : server.status === 'installing' ? (
                <Notification className='mb-4' loading>
                  Your Server is currently being installed. Please wait...
                  <Button
                    className='ml-2'
                    leftSection={<FontAwesomeIcon icon={faCancel} />}
                    variant='subtle'
                    loading={abortLoading}
                    onClick={doAbortInstall}
                  >
                    Cancel
                  </Button>
                </Notification>
              ) : null}

              <Suspense fallback={<Spinner.Centered />}>
                <Routes>
                  {serverRoutes
                    .filter((route) => !route.filter || route.filter())
                    .map(({ path, element: Element }) => (
                      <Route key={path} path={path} element={<Element />} />
                    ))}
                  {window.extensionContext.routes.serverRoutes
                    .filter((route) => !route.filter || route.filter())
                    .map(({ path, element: Element }) => (
                      <Route key={path} path={path} element={<Element />} />
                    ))}
                  <Route path='*' element={<NotFound />} />
                </Routes>
              </Suspense>
            </>
          ) : (
            <NotFound />
          )}
        </Container>
      </div>
    </div>
  );
}
