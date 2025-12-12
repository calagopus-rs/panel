import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getDatabases from '@/api/server/databases/getDatabases';
import Button from '@/elements/Button';
import ConditionalTooltip from '@/elements/ConditionalTooltip';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useServerStore } from '@/stores/server';
import DatabaseRow from './DatabaseRow';
import DatabaseCreateModal from './modals/DatabaseCreateModal';

export default function ServerDatabases() {
  const { server, databases, setDatabases } = useServerStore();

  const [openModal, setOpenModal] = useState<'create' | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getDatabases(server.uuid, page, search),
    setStoreData: setDatabases,
  });

  return (
    <>
      <DatabaseCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify='space-between' align='center' mb='md'>
        <Title order={1} c='white'>
          Databases
          <p className='text-xs text-gray-300!'>
            {databases.total} of {server.featureLimits.databases} maximum databases created.
          </p>
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <ConditionalTooltip
            enabled={databases.total >= server.featureLimits.databases}
            label={`This server is limited to ${server.featureLimits.databases} databases.`}
          >
            <Button
              disabled={databases.total >= server.featureLimits.databases}
              onClick={() => setOpenModal('create')}
              color='blue'
              leftSection={<FontAwesomeIcon icon={faPlus} />}
            >
              Create
            </Button>
          </ConditionalTooltip>
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table
          columns={['Name', 'Type', 'Address', 'Username', 'Size', 'Locked?', '']}
          loading={loading}
          pagination={databases}
          onPageSelect={setPage}
        >
          {databases.data.map((database) => (
            <DatabaseRow database={database} key={database.uuid} />
          ))}
        </Table>
      </ContextMenuProvider>
    </>
  );
}
