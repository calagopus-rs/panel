import { faPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, TextInput, Title } from '@mantine/core';
import jsYaml from 'js-yaml';
import { ChangeEvent, useRef } from 'react';
import { Route, Routes, useNavigate } from 'react-router';
import { z } from 'zod';
import createOAuthProvider from '@/api/admin/oauth-providers/createOAuthProvider';
import getOAuthProviders from '@/api/admin/oauth-providers/getOAuthProviders';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Table from '@/elements/Table';
import { oauthProviderTableColumns } from '@/lib/tableColumns';
import { transformKeysToCamelCase } from '@/lib/transformers';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import DatabaseHostCreateOrUpdate from './OAuthProviderCreateOrUpdate';
import DatabaseHostRow from './OAuthProviderRow';
import DatabaseHostView from './OAuthProviderView';
import { adminOAuthProviderSchema } from '@/lib/schemas/admin/oauthProviders';

function OAuthProvidersContainer() {
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

    event.target.value = '';

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
      ...(transformKeysToCamelCase(data) as z.infer<typeof adminOAuthProviderSchema>),
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
  };

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          OAuth Providers
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => fileInputRef.current?.click()} color='blue'>
            <FontAwesomeIcon icon={faUpload} className='mr-2' />
            Import
          </Button>
          <Button
            onClick={() => navigate('/admin/oauth-providers/new')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>

          <input
            type='file'
            accept='.json,.yml,.yaml'
            ref={fileInputRef}
            className='hidden'
            onChange={handleFileUpload}
          />
        </Group>
      </Group>

      <Table columns={oauthProviderTableColumns} loading={loading} pagination={oauthProviders} onPageSelect={setPage}>
        {oauthProviders.data.map((oauthProvider) => (
          <DatabaseHostRow key={oauthProvider.uuid} oauthProvider={oauthProvider} />
        ))}
      </Table>
    </>
  );
}

export default function AdminOAuthProviders() {
  return (
    <Routes>
      <Route path='/' element={<OAuthProvidersContainer />} />
      <Route path='/new' element={<DatabaseHostCreateOrUpdate />} />
      <Route path='/:id/*' element={<DatabaseHostView />} />
    </Routes>
  );
}
