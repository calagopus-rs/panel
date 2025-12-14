import { faAt, faDatabase, faLayerGroup, faRobot, faServer, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router';
import getSettings from '@/api/admin/settings/getSettings.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Spinner from '@/elements/Spinner.tsx';
import SubNavigation from '@/elements/SubNavigation.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';
import ApplicationContainer from './ApplicationContainer.tsx';
import CaptchaContainer from './CaptchaContainer.tsx';
import EmailContainer from './EmailContainer.tsx';
import ServerContainer from './ServerContainer.tsx';
import StorageContainer from './StorageContainer.tsx';
import WebauthnContainer from './WebauthnContainer.tsx';

export default function AdminSettings() {
  const { addToast } = useToast();
  const { setSettings } = useAdminStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Title order={1}>Settings</Title>

      <SubNavigation
        items={[
          {
            name: 'Application',
            icon: faLayerGroup,
            link: '/admin/settings',
          },
          {
            name: 'Storage',
            icon: faDatabase,
            link: '/admin/settings/storage',
          },
          {
            name: 'Mail',
            icon: faAt,
            link: '/admin/settings/mail',
          },
          {
            name: 'Captcha',
            icon: faRobot,
            link: '/admin/settings/captcha',
          },
          {
            name: 'Webauthn',
            icon: faUserCheck,
            link: '/admin/settings/webauthn',
          },
          {
            name: 'Server',
            icon: faServer,
            link: '/admin/settings/server',
          },
        ]}
      />

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Routes>
          <Route path='/' element={<ApplicationContainer />} />
          <Route path='/storage' element={<StorageContainer />} />
          <Route path='/mail' element={<EmailContainer />} />
          <Route path='/captcha' element={<CaptchaContainer />} />
          <Route path='/webauthn' element={<WebauthnContainer />} />
          <Route path='/server' element={<ServerContainer />} />
        </Routes>
      )}
    </>
  );
}
