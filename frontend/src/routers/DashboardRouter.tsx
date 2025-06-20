import Sidebar from '@/elements/sidebar/Sidebar';
import DashboardHome from '@/pages/dashboard/home/DashboardHome';
import { useState } from 'react';
import { Route, Routes } from 'react-router';
import CollapsedIcon from '@/assets/pterodactyl.svg';
import classNames from 'classnames';
import styles from '@/elements/sidebar/sidebar.module.css';
import NotFound from '@/pages/NotFound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase, faCloud, faKey, faMagnifyingGlass, faServer, faUser } from '@fortawesome/free-solid-svg-icons';
import DashboardAccount from '@/pages/dashboard/DashboardAccount';
import DashboardApi from '@/pages/dashboard/DashboardApi';
import DashboardSsh from '@/pages/dashboard/DashboardSsh';
import DashboardActivity from '@/pages/dashboard/DashboardActivity';

export default function DashboardRouter() {
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
            <Sidebar.Link to={'/account'} end>
              <FontAwesomeIcon icon={faUser} />
              <span>Account</span>
            </Sidebar.Link>
            <Sidebar.Link to={'/account/api'} end>
              <FontAwesomeIcon icon={faCloud} />
              <span>API Credentials</span>
            </Sidebar.Link>
            <Sidebar.Link to={'/account/ssh'} end>
              <FontAwesomeIcon icon={faKey} />
              <span>SSH Keys</span>
            </Sidebar.Link>
            <Sidebar.Link to={'/account/activity'} end>
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
          <Route path="" element={<DashboardHome />} />
          <Route path="/account" element={<DashboardAccount />} />
          <Route path="/account/api" element={<DashboardApi />} />
          <Route path="/account/ssh" element={<DashboardSsh />} />
          <Route path="/account/activity" element={<DashboardActivity />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}
