import { faPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import jsYaml from 'js-yaml';
import { ChangeEvent, useRef } from 'react';
import { Route, Routes, useNavigate } from 'react-router';
import { z } from 'zod';
import createOAuthProvider from '@/api/admin/oauth-providers/createOAuthProvider.ts';
import getOAuthProviders from '@/api/admin/oauth-providers/getOAuthProviders.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { adminOAuthProviderSchema } from '@/lib/schemas/admin/oauthProviders.ts';
import { oauthProviderTableColumns } from '@/lib/tableColumns.ts';
import { transformKeysToCamelCase } from '@/lib/transformers.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';
import DatabaseHostCreateOrUpdate from './OAuthProviderCreateOrUpdate.tsx';
import DatabaseHostRow from './OAuthProviderRow.tsx';
import DatabaseHostView from './OAuthProviderView.tsx';

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
    <AdminContentContainer
      title='OAuth Providers'
      search={search}
      setSearch={setSearch}
      contentRight={
        <>
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
        </>
      }
    >
      <Table columns={oauthProviderTableColumns} loading={loading} pagination={oauthProviders} onPageSelect={setPage}>
        {oauthProviders.data.map((oauthProvider) => (
          <DatabaseHostRow key={oauthProvider.uuid} oauthProvider={oauthProvider} />
        ))}
      </Table>
    </AdminContentContainer>
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
