import { Route, Routes, useParams } from 'react-router';
import SubNavigation from '@/elements/SubNavigation';
import { faBriefcase, faCog, faComputer, faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import getUser from '@/api/admin/users/getUser';
import AdminUserServers from '@/pages/admin/users/servers/AdminUserServers';
import UserCreateOrUpdate from '@/pages/admin/users/UserCreateOrUpdate';
import AdminUserOAuthLinks from './oauthLinks/AdminUserOAuthLinks';
import AdminUserActivity from './activity/AdminUserActivity';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (params.id) {
      getUser(params.id)
        .then((user) => {
          setUser(user);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  return !user ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{user.username}</Title>

      <SubNavigation
        items={[
          {
            name: 'General',
            icon: faCog,
            link: `/admin/users/${params.id}`,
          },
          {
            name: 'Servers',
            icon: faComputer,
            link: `/admin/users/${params.id}/servers`,
          },
          {
            name: 'OAuth Links',
            icon: faFingerprint,
            link: `/admin/users/${params.id}/oauth-links`,
          },
          {
            name: 'Activity',
            icon: faBriefcase,
            link: `/admin/users/${params.id}/activity`,
          },
        ]}
      />

      <Routes>
        <Route path={'/'} element={<UserCreateOrUpdate contextUser={user} />} />
        <Route path={'/servers'} element={<AdminUserServers user={user} />} />
        <Route path={'/oauth-links'} element={<AdminUserOAuthLinks user={user} />} />
        <Route path={'/activity'} element={<AdminUserActivity user={user} />} />
      </Routes>
    </>
  );
};
