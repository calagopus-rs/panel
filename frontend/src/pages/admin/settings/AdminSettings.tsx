import { useEffect, useState } from 'react';
import { useAdminStore } from '@/stores/admin';
import getSettings from '@/api/admin/settings/getSettings';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import SubNavigation from '@/elements/SubNavigation';
import { faAt, faLayerGroup, faRobot, faServer } from '@fortawesome/free-solid-svg-icons';
import { Route, Routes } from 'react-router';
import EmailContainer from './EmailContainer';
import Spinner from '@/elements/Spinner';
import ApplicationContainer from './ApplicationContainer';
import ServerContainer from './ServerContainer';
import CaptchaContainer from './CaptchaContainer';
import { Title } from '@mantine/core';
import { load } from '@/lib/debounce';

export default () => {
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
          <Route path={'/mail'} element={<EmailContainer />} />
          <Route path={'/captcha'} element={<CaptchaContainer />} />
          <Route path={'/server'} element={<ServerContainer />} />
        </Routes>
      )}
    </>
  );
};
