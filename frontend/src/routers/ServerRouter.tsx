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
import ServerUsers from '@/pages/server/users/ServerUsers';
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

export default () => {
  const params = useParams<'id'>();
  const [loading, setLoading] = useState(true);

  const clearState = useServerStore(state => state.clear);
  const getServer = useServerStore(state => state.getServer);

  const avatarURL = 'https://placehold.co/400x400/png';

  useEffect(() => {
    return () => {
      clearState();
    };
  }, []);

  useEffect(() => {
    getServer(params.id).then(() => setLoading(false));
  }, [params.id]);

  return (
    <>
      <div className="flex">
        <Sidebar collapsed={false}>
          <div className="h-fit w-full flex flex-col items-center justify-center mt-1 select-none cursor-pointer">
            <img src={CollapsedIcon} className="my-4 h-20" alt={'Pterodactyl Icon'} />
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
            <Sidebar.Link to={`/server/${params.id}/users`} end>
              <FontAwesomeIcon icon={faUsers} />
              <span>Users</span>
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
          <Sidebar.User>
            {avatarURL && (
              <img src={`${avatarURL}?s=64`} alt="Profile Picture" className="h-10 w-10 rounded-full select-none" />
            )}
            <div className="flex flex-col ml-3">
              <span className="font-sans font-normal text-sm text-neutral-50 whitespace-nowrap leading-tight select-none">
                Jelco
              </span>
              <span className="font-normal text-xs text-neutral-300 whitespace-nowrap leading-tight select-none">
                Admin
              </span>
            </div>
          </Sidebar.User>
        </Sidebar>

        {loading ? (
          <div className="w-full h-screen flex items-center justify-center">
            <Spinner size={75} />
          </div>
        ) : (
          <>
            <WebsocketHandler />
            <WebsocketListener />

            <ErrorBoundary>
              <Routes>
                <Route path="" element={<ServerConsole />} />
                <Route path="/files" element={<ServerFiles />} />
                <Route path="/files/new/*" element={<FileEditor />} />
                <Route path="/files/edit/*" element={<FileEditor />} />
                <Route path="/files/directory/*" element={<ServerFiles />} />
                <Route path="/databases" element={<ServerDatabases />} />
                <Route path="/schedules" element={<ServerSchedules />} />
                <Route path="/schedules/:id" element={<ScheduleView />} />
                <Route path="/users" element={<ServerUsers />} />
                <Route path="/backups" element={<ServerBackups />} />
                <Route path="/network" element={<ServerNetwork />} />
                <Route path="/startup" element={<ServerStartup />} />
                <Route path="/settings" element={<ServerSettings />} />
                <Route path="/activity" element={<ServerActivity />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </>
        )}
      </div>
    </>
  );
};
