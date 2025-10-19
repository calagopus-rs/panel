import Spinner from '@/elements/Spinner';
import { useState } from 'react';
import { useUserStore } from '@/stores/user';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import ApiKeyRow from './ApiKeyRow';
import ApiKeyCreateModal from './modals/ApiKeyCreateModal';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import getApiKeys from '@/api/me/api-keys/getApiKeys';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default () => {
  const { apiKeys, setApiKeys } = useUserStore();

  const [openModal, setOpenModal] = useState<'create'>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getApiKeys,
    setStoreData: setApiKeys,
  });

  return (
    <>
      <ApiKeyCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          API Keys
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('create')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table
            columns={['Name', 'Key', 'Permissions', 'Last Used', 'Created', '']}
            pagination={apiKeys}
            onPageSelect={setPage}
          >
            {apiKeys.data.map((key) => (
              <ApiKeyRow key={key.uuid} apiKey={key} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
