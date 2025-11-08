import Spinner from '@/elements/Spinner';
import { Route, Routes, useNavigate } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import DatabaseHostCreateOrUpdate from './OAuthProviderCreateOrUpdate';
import DatabaseHostRow, { oauthProviderTableColumns } from './OAuthProviderRow';
import { Group, TextInput, Title } from '@mantine/core';
import Table from '@/elements/Table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Button from '@/elements/Button';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import DatabaseHostView from './OAuthProviderView';
import getOAuthProviders from '@/api/admin/oauth-providers/getOAuthProviders';

const OAuthProvidersContainer = () => {
  const navigate = useNavigate();
  const { oauthProviders, setOAuthProviders } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getOAuthProviders,
    setStoreData: setOAuthProviders,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          OAuth Providers
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/oauth-providers/new')}
            color={'blue'}
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={oauthProviderTableColumns} pagination={oauthProviders} onPageSelect={setPage}>
          {oauthProviders.data.map((oauthProvider) => (
            <DatabaseHostRow key={oauthProvider.uuid} oauthProvider={oauthProvider} />
          ))}
        </Table>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<OAuthProvidersContainer />} />
      <Route path={'/new'} element={<DatabaseHostCreateOrUpdate />} />
      <Route path={'/:id/*'} element={<DatabaseHostView />} />
    </Routes>
  );
};
