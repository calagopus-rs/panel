import Spinner from '@/elements/Spinner';
import { Route, Routes, useNavigate } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import DatabaseHostCreateOrUpdate from './OAuthProviderCreateOrUpdate';
import DatabaseHostRow, { oauthProviderTableColumns } from './OAuthProviderRow';
import { Group, TextInput, Title } from '@mantine/core';
import Table from '@/elements/Table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import Button from '@/elements/Button';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import DatabaseHostView from './OAuthProviderView';
import getOAuthProviders from '@/api/admin/oauth-providers/getOAuthProviders';
import { ChangeEvent, useRef } from 'react';
import { useToast } from '@/providers/ToastProvider';
import jsYaml from 'js-yaml';
import { httpErrorToHuman } from '@/api/axios';
import createOAuthProvider from '@/api/admin/oauth-providers/createOAuthProvider';
import { transformKeysToCamelCase } from '@/api/transformers';

const OAuthProvidersContainer = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { oauthProviders, addOAuthProvider, setOAuthProviders } = useAdminStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getOAuthProviders,
    setStoreData: setOAuthProviders,
  });

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = null;

    try {
      const text = await file.text().then((t) => t.trim());
      let data: object;
      try {
        if (text.startsWith('{')) {
          data = JSON.parse(text);
        } else {
          data = jsYaml.load(text) as object;
        }
      } catch (err) {
        addToast(`Failed to parse oauth provider: ${err}`, 'error');
        return;
      }

      createOAuthProvider({
        ...(transformKeysToCamelCase(data) as UpdateAdminOAuthProvider),
        clientId: 'example',
        clientSecret: 'example',
      })
        .then((data) => {
          addOAuthProvider(data);
          addToast('OAuth Provider imported.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    } catch (err) {
      addToast(httpErrorToHuman(err), 'error');
    }
  };

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          OAuth Providers
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => fileInputRef.current?.click()} color={'blue'}>
            <FontAwesomeIcon icon={faUpload} className={'mr-2'} />
            Import
          </Button>
          <Button
            onClick={() => navigate('/admin/oauth-providers/new')}
            color={'blue'}
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>

          <input
            type={'file'}
            accept={'.json,.yml,.yaml'}
            ref={fileInputRef}
            className={'hidden'}
            onChange={handleFileUpload}
          />
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
