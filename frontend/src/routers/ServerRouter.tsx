import Sidebar from '@/elements/sidebar/Sidebar';
import DashboardHome from '@/pages/dashboard/DashboardHome';
import { useState } from 'react';
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
import ServerConsole from '@/pages/server/ServerConsole';
import ServerFiles from '@/pages/server/ServerFiles';
import ServerDatabases from '@/pages/server/ServerDatabases';
import ServerSchedules from '@/pages/server/ServerSchedules';
import ServerUsers from '@/pages/server/ServerUsers';
import ServerBackups from '@/pages/server/ServerBackups';
import ServerNetwork from '@/pages/server/ServerNetwork';
import ServerStartup from '@/pages/server/ServerStartup';
import ServerSettings from '@/pages/server/ServerSettings';
import ServerActivity from '@/pages/server/ServerActivity';
import ServerFilesEdit from '@/pages/server/ServerFilesEdit';

export default function ServerRouter() {
  const params = useParams<'id'>();

  const avatarURL = 'https://placehold.co/400x400/png';
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <div className="flex">
        <Sidebar collapsed={collapsed}>
          <div
            className="h-fit w-full flex flex-col items-center justify-center mt-1 select-none cursor-pointer"
            onClick={() => setCollapsed(!collapsed)}
          >
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
            <Sidebar.Link to={`/server/${params.id}/files`} end>
              <FontAwesomeIcon icon={faFolderOpen} />
              <span>Files</span>
            </Sidebar.Link>
            <Sidebar.Link to={`/server/${params.id}/databases`} end>
              <FontAwesomeIcon icon={faDatabase} />
              <span>Databases</span>
            </Sidebar.Link>
            <Sidebar.Link to={`/server/${params.id}/schedules`} end>
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
              <span className="font-header font-normal text-xs text-neutral-300 whitespace-nowrap leading-tight select-none">
                Admin
              </span>
            </div>
          </Sidebar.User>
        </Sidebar>
        <Routes>
          <Route path="" element={<ServerConsole />} />
          <Route path="/files" element={<ServerFiles />} />
          <Route path="/files/edit/*" element={<ServerFilesEdit />} />
          <Route path="/files/directory/*" element={<ServerFiles />} />
          <Route path="/databases" element={<ServerDatabases />} />
          <Route path="/schedules" element={<ServerSchedules />} />
          <Route path="/users" element={<ServerUsers />} />
          <Route path="/backups" element={<ServerBackups />} />
          <Route path="/network" element={<ServerNetwork />} />
          <Route path="/startup" element={<ServerStartup />} />
          <Route path="/settings" element={<ServerSettings />} />
          <Route path="/activity" element={<ServerActivity />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}
