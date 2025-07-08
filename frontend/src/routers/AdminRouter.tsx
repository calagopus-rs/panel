import Sidebar from '@/elements/sidebar/Sidebar';
import { Route, Routes } from 'react-router';
import CollapsedIcon from '@/assets/pterodactyl.svg';
import NotFound from '@/pages/NotFound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faReply, faWrench } from '@fortawesome/free-solid-svg-icons';
import AdminSettings from '@/pages/admin/settings/AdminSettings';
import AdminHome from '@/pages/admin/AdminHome';

export default () => {
  return (
    <>
      <div className="flex">
        <Sidebar collapsed={false}>
          <div className="h-fit w-full flex flex-col items-center justify-center mt-1 select-none cursor-pointer">
            <img src={CollapsedIcon} className="my-4 h-20" alt="Pterodactyl Icon" />
          </div>
          <Sidebar.Section>
            <Sidebar.Link to="/" end>
              <FontAwesomeIcon icon={faReply} />
              <span>Back</span>
            </Sidebar.Link>
          </Sidebar.Section>
          <Sidebar.Section>
            <Sidebar.Link to="/admin" end>
              <FontAwesomeIcon icon={faBuilding} />
              <span>Overview</span>
            </Sidebar.Link>
            <Sidebar.Link to="/admin/settings">
              <FontAwesomeIcon icon={faWrench} />
              <span>Settings</span>
            </Sidebar.Link>
          </Sidebar.Section>
          <Sidebar.User />
        </Sidebar>
        <Routes>
          <Route path="" element={<AdminHome />} />
          <Route path="/settings/*" element={<AdminSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
};
