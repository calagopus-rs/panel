import Spinner from '@/elements/Spinner';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
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
import { load } from '@/lib/debounce';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { server, databases, setDatabases } = useServerStore();

  const [loading, setLoading] = useState(databases.data.length === 0);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState<'create'>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getDatabases(server.uuid, page, search).then((data) => {
      setDatabases(data);
      load(false, setLoading);
    });
  }, [page, search]);

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
