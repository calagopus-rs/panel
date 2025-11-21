import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getApiKeys from '@/api/me/api-keys/getApiKeys';
import Button from '@/elements/Button';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import ApiKeyCreateOrUpdateModal from '@/pages/dashboard/api-keys/modals/ApiKeyCreateOrUpdateModal';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useUserStore } from '@/stores/user';
import ApiKeyRow from './ApiKeyRow';

export default function DashboardApiKeys() {
  const { apiKeys, setApiKeys } = useUserStore();

  const [openModal, setOpenModal] = useState<'create'>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getApiKeys,
    setStoreData: setApiKeys,
  });

  return (
    <>
      <ApiKeyCreateOrUpdateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify='space-between' align='start' mb='md'>
        <Title order={1} c='white'>
          API Keys
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('create')} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create
          </Button>
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table
          columns={['Name', 'Key', 'User / Server / Admin Permissions', 'Last Used', 'Created', '']}
          loading={loading}
          pagination={apiKeys}
          onPageSelect={setPage}
        >
          {apiKeys.data.map((key) => (
            <ApiKeyRow key={key.uuid} apiKey={key} />
          ))}
        </Table>
      </ContextMenuProvider>
    </>
  );
}
