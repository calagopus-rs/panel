import Spinner from '@/elements/Spinner';
import { useServerStore } from '@/stores/server';
import { useState } from 'react';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import DatabaseRow from './DatabaseRow';
import getDatabases from '@/api/server/databases/getDatabases';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import DatabaseCreateModal from './modals/DatabaseCreateModal';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default () => {
  const { server, databases, setDatabases } = useServerStore();

  const [openModal, setOpenModal] = useState<'create'>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getDatabases(server.uuid, page, search),
    setStoreData: setDatabases,
  });

  return (
    <>
      <DatabaseCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Databases
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
            columns={['Name', 'Type', 'Address', 'Username', 'Size', 'Locked?', '']}
            pagination={databases}
            onPageSelect={setPage}
          >
            {databases.data.map((database) => (
              <DatabaseRow database={database} key={database.uuid} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
