import Sidebar from '@/elements/sidebar/Sidebar';
import { useEffect, useState } from 'react';
import { Route, Routes, useParams } from 'react-router';
import CollapsedIcon from '@/assets/pterodactyl.svg';
import classNames from 'classnames';
import styles from '@/elements/sidebar/sidebar.module.css';
import NotFound from '@/pages/NotFound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxArchive,
  faBriefcase,
  faCog,
  faDatabase,
  faFolderOpen,
  faMagnifyingGlass,
  faNetworkWired,
  faPlay,
  faServer,
  faStopwatch,
  faTerminal,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import ServerConsole from '@/pages/server/console/ServerConsole';
import ServerFiles from '@/pages/server/files/ServerFiles';
import ServerDatabases from '@/pages/server/databases/ServerDatabases';
import ServerSchedules from '@/pages/server/schedules/ServerSchedules';
import ServerBackups from '@/pages/server/backups/ServerBackups';
import ServerNetwork from '@/pages/server/network/ServerNetwork';
import ServerStartup from '@/pages/server/startup/ServerStartup';
import ServerSettings from '@/pages/server/settings/ServerSettings';
import ServerActivity from '@/pages/server/activity/ServerActivity';
import FileEditor from '@/pages/server/files/FileEditor';
import { useServerStore } from '@/stores/server';
import Spinner from '@/elements/Spinner';
import WebsocketHandler from '@/pages/server/WebsocketHandler';
import ErrorBoundary from '@/elements/ErrorBoundary';
import WebsocketListener from '@/pages/server/WebsocketListener';
import ScheduleView from '@/pages/server/schedules/ScheduleView';
import getServer from '@/api/server/getServer';
import ServerSubusers from '@/pages/server/subusers/ServerSubusers';

export default () => {
  const params = useParams<'id'>();
  const [loading, setLoading] = useState(true);

  const resetState = useServerStore((state) => state.reset);
  const setServer = useServerStore((state) => state.setServer);

  useEffect(() => {
    return () => {
      resetState();
    };
  }, []);

  useEffect(() => {
    getServer(params.id).then((data) => {
      setServer(data);
      setLoading(false);
    });
  }, [params.id]);

  return (
    <>
      <div className={'flex'}>
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
          </Sidebar.Section>
          <Sidebar.Section>
            <Sidebar.Link to={`/server/${params.id}`} end>
              <FontAwesomeIcon icon={faTerminal} />
              <span>Console</span>
            </Sidebar.Link>
            <Sidebar.Link to={`/server/${params.id}/files`}>
              <FontAwesomeIcon icon={faFolderOpen} />
              <span>Files</span>
            </Sidebar.Link>
            <Sidebar.Link to={`/server/${params.id}/databases`} end>
              <FontAwesomeIcon icon={faDatabase} />
              <span>Databases</span>
            </Sidebar.Link>
            <Sidebar.Link to={`/server/${params.id}/schedules`}>
              <FontAwesomeIcon icon={faStopwatch} />
              <span>Schedules</span>
            </Sidebar.Link>
            <Sidebar.Link to={`/server/${params.id}/subusers`} end>
              <FontAwesomeIcon icon={faUsers} />
              <span>Subusers</span>
            </Sidebar.Link>
            <Sidebar.Link to={`/server/${params.id}/backups`} end>
              <FontAwesomeIcon icon={faBoxArchive} />
              <span>Backups</span>
            </Sidebar.Link>
            <Sidebar.Link to={`/server/${params.id}/network`} end>
              <FontAwesomeIcon icon={faNetworkWired} />
              <span>Network</span>
            </Sidebar.Link>
            <Sidebar.Link to={`/server/${params.id}/startup`} end>
              <FontAwesomeIcon icon={faPlay} />
              <span>Startup</span>
            </Sidebar.Link>
            <Sidebar.Link to={`/server/${params.id}/settings`} end>
              <FontAwesomeIcon icon={faCog} />
              <span>Settings</span>
            </Sidebar.Link>
            <Sidebar.Link to={`/server/${params.id}/activity`} end>
              <FontAwesomeIcon icon={faBriefcase} />
              <span>Activity</span>
            </Sidebar.Link>
          </Sidebar.Section>
          <Sidebar.User />
        </Sidebar>

        {loading ? (
          <div className={'w-full h-screen flex items-center justify-center'}>
            <Spinner size={75} />
          </div>
        ) : (
          <>
            <WebsocketHandler />
            <WebsocketListener />

            <ErrorBoundary>
              <Routes>
                <Route path={''} element={<ServerConsole />} />
                <Route path={'/files'} element={<ServerFiles />} />
                <Route path={'/files/:action'} element={<FileEditor />} />
                <Route path={'/databases'} element={<ServerDatabases />} />
                <Route path={'/schedules'} element={<ServerSchedules />} />
                <Route path={'/schedules/:id'} element={<ScheduleView />} />
                <Route path={'/subusers'} element={<ServerSubusers />} />
                <Route path={'/backups'} element={<ServerBackups />} />
                <Route path={'/network'} element={<ServerNetwork />} />
                <Route path={'/startup'} element={<ServerStartup />} />
                <Route path={'/settings'} element={<ServerSettings />} />
                <Route path={'/activity'} element={<ServerActivity />} />
                <Route path={'*'} element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </>
        )}
      </div>
    </>
  );
};
