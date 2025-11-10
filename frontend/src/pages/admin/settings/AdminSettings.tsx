import { faAt, faDatabase, faLayerGroup, faRobot, faServer, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router';
import getSettings from '@/api/admin/settings/getSettings';
import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import SubNavigation from '@/elements/SubNavigation';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import ApplicationContainer from './ApplicationContainer';
import CaptchaContainer from './CaptchaContainer';
import EmailContainer from './EmailContainer';
import ServerContainer from './ServerContainer';
import StorageContainer from './StorageContainer';
import WebauthnContainer from './WebauthnContainer';

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
      .finally(() => load(false, setLoading));
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
          <Route path={'/'} element={<ApplicationContainer />} />
          <Route path={'/storage'} element={<StorageContainer />} />
          <Route path={'/mail'} element={<EmailContainer />} />
          <Route path={'/captcha'} element={<CaptchaContainer />} />
          <Route path={'/webauthn'} element={<WebauthnContainer />} />
          <Route path={'/server'} element={<ServerContainer />} />
        </Routes>
      )}
    </>
  );
}
