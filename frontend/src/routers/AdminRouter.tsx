import Sidebar from '@/elements/sidebar/Sidebar';
import { Route, Routes } from 'react-router';
import CollapsedIcon from '@/assets/pterodactyl.svg';
import NotFound from '@/pages/NotFound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWrench } from '@fortawesome/free-solid-svg-icons';
import AdminSettings from '@/pages/admin/settings/AdminSettings';

export default () => {
  return (
    <>
      <div className="flex">
        <Sidebar collapsed={false}>
          <div className="h-fit w-full flex flex-col items-center justify-center mt-1 select-none cursor-pointer">
            <img src={CollapsedIcon} className="my-4 h-20" alt={'Pterodactyl Icon'} />
          </div>
          <Sidebar.Section>
            <Sidebar.Link to={'/admin/settings'} end>
              <FontAwesomeIcon icon={faWrench} />
              <span>Settings</span>
            </Sidebar.Link>
          </Sidebar.Section>
          <Sidebar.User />
        </Sidebar>
        <Routes>
          <Route path="" element={<div></div>} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
};
