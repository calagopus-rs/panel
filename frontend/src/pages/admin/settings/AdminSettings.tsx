import Container from '@/elements/Container';
import { useEffect } from 'react';
import { useAdminStore } from '@/stores/admin';
import getSettings from '@/api/admin/settings/getSettings';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { SubNavigation, SubNavigationLink } from '@/elements/subnavigation/SubNavigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAt, faLayerGroup, faRobot, faServer } from '@fortawesome/free-solid-svg-icons';
import { Route, Routes } from 'react-router';

export const SettingContainer = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="bg-gray-700/50 rounded-md p-4 h-fit">
      <h1 className="text-4xl font-bold text-white">{title}</h1>

      {children}
    </div>
  );
};

export default () => {
  const { addToast } = useToast();
  const { setSettings } = useAdminStore(state => state.settings);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  });

  return (
    <Container>
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-white">Settings</h1>
      </div>

      <SubNavigation>
        <SubNavigationLink to="/admin/settings" name="Application">
          <FontAwesomeIcon icon={faLayerGroup} />
        </SubNavigationLink>
        <SubNavigationLink to="/admin/settings/mail" name="Mail">
          <FontAwesomeIcon icon={faAt} />
        </SubNavigationLink>
        <SubNavigationLink to="/admin/settings/captcha" name="Captcha">
          <FontAwesomeIcon icon={faRobot} />
        </SubNavigationLink>
        <SubNavigationLink to="/admin/settings/server" name="Server">
          <FontAwesomeIcon icon={faServer} />
        </SubNavigationLink>
      </SubNavigation>

      <Routes>
        <Route path="/" element={<p>General</p>} />
        <Route path="/mail" element={<p>Mail</p>} />
        <Route path="/captcha" element={<p>Captcha</p>} />
        <Route path="/server" element={<p>Server</p>} />
      </Routes>
    </Container>
  );
};
