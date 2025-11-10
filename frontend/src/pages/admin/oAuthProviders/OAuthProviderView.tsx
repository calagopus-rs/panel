import { faCog, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Route, Routes, useParams } from 'react-router';
import getOAuthProvider from '@/api/admin/oauth-providers/getOAuthProvider';
import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import SubNavigation from '@/elements/SubNavigation';
import AdminOAuthProviderUsers from '@/pages/admin/oAuthProviders/users/AdminOAuthProviderUsers';
import { useToast } from '@/providers/ToastProvider';
import OAuthProviderCreateOrUpdate from './OAuthProviderCreateOrUpdate';

export default function OAuthProviderView() {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const [oauthProvider, setOAuthProvider] = useState<AdminOAuthProvider | null>(null);

  useEffect(() => {
    if (params.id) {
      getOAuthProvider(params.id)
        .then((oauthProvider) => {
          setOAuthProvider(oauthProvider);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  return !oauthProvider ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{oauthProvider.name}</Title>

      <SubNavigation
        items={[
          {
            name: 'General',
            icon: faCog,
            link: `/admin/oauth-providers/${params.id}`,
          },
          {
            name: 'Users',
            icon: faUsers,
            link: `/admin/oauth-providers/${params.id}/users`,
          },
        ]}
      />

      <Routes>
        <Route path={'/'} element={<OAuthProviderCreateOrUpdate contextOAuthProvider={oauthProvider} />} />
        <Route path={'/users'} element={<AdminOAuthProviderUsers oauthProvider={oauthProvider} />} />
      </Routes>
    </>
  );
}
