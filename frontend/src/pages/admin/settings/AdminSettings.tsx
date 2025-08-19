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
import { Title } from '@mantine/core';

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
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Title order={1}>Settings</Title>

      <SubNavigation>
        <SubNavigationLink to={'/admin/settings'} name={'Application'} icon={faLayerGroup} />
        <SubNavigationLink to={'/admin/settings/mail'} name={'Mail'} icon={faAt} />
        <SubNavigationLink to={'/admin/settings/captcha'} name={'Captcha'} icon={faRobot} />
        <SubNavigationLink to={'/admin/settings/server'} name={'Server'} icon={faServer} />
      </SubNavigation>

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
