import Container from '@/elements/Container';
import { useEffect, useState } from 'react';
import { useAdminStore } from '@/stores/admin';
import getSettings from '@/api/admin/settings/getSettings';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { SubNavigation, SubNavigationLink } from '@/elements/SubNavigation';
import { faAt, faLayerGroup, faRobot, faServer } from '@fortawesome/free-solid-svg-icons';
import { Route, Routes } from 'react-router';
import EmailContainer from './EmailContainer';
import Spinner from '@/elements/Spinner';
import ApplicationContainer from './ApplicationContainer';
import ServerContainer from './ServerContainer';
import CaptchaContainer from './CaptchaContainer';

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
  const { setSettings } = useAdminStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container>
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-white">Settings</h1>
      </div>

      <SubNavigation>
        <SubNavigationLink to="/admin/settings" name="Application" icon={faLayerGroup} />
        <SubNavigationLink to="/admin/settings/mail" name="Mail" icon={faAt} />
        <SubNavigationLink to="/admin/settings/captcha" name="Captcha" icon={faRobot} />
        <SubNavigationLink to="/admin/settings/server" name="Server" icon={faServer} />
      </SubNavigation>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Routes>
          <Route path="/" element={<ApplicationContainer />} />
          <Route path="/mail" element={<EmailContainer />} />
          <Route path="/captcha" element={<CaptchaContainer />} />
          <Route path="/server" element={<ServerContainer />} />
        </Routes>
      )}
    </Container>
  );
};
