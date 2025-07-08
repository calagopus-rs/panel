import Sidebar from '@/elements/sidebar/Sidebar';
import DashboardHome from '@/pages/dashboard/home/DashboardHome';
import { Route, Routes } from 'react-router';
import CollapsedIcon from '@/assets/pterodactyl.svg';
import classNames from 'classnames';
import styles from '@/elements/sidebar/sidebar.module.css';
import NotFound from '@/pages/NotFound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase, faCloud, faKey, faMagnifyingGlass, faServer, faUser } from '@fortawesome/free-solid-svg-icons';
import DashboardAccount from '@/pages/dashboard/account/DashboardAccount';
import DashboardApi from '@/pages/dashboard/DashboardApi';
import DashboardSsh from '@/pages/dashboard/DashboardSsh';
import DashboardActivity from '@/pages/dashboard/DashboardActivity';
import { useAuth } from '@/providers/AuthProvider';

export default () => {
  const { user } = useAuth();

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
            {user.admin && (
              <Sidebar.Link to={'/admin'} end>
                <FontAwesomeIcon icon={faServer} />
                <span>Admin</span>
              </Sidebar.Link>
            )}
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
          <Sidebar.User />
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
};
