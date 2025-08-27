import Spinner from '@/elements/Spinner';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/user';
import { useSearchParams } from 'react-router';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { load } from '@/lib/debounce';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import ApiKeyRow from './ApiKeyRow';
import ApiKeyCreateModal from './modals/ApiKeyCreateModal';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import getApiKeys from '@/api/me/api-keys/getApiKeys';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { apiKeys, setApiKeys } = useUserStore();

  const [openModal, setOpenModal] = useState<'create'>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getApiKeys(page, search).then((data) => {
      setApiKeys(data);
      load(false, setLoading);
    });
  }, [page, search]);

  return (
    <>
      <ApiKeyCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          API Keys
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
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
