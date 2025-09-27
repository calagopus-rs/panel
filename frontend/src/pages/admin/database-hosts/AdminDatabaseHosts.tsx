import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import DatabaseHostCreateOrUpdate from './DatabaseHostCreateOrUpdate';
import getDatabaseHosts from '@/api/admin/databaseHosts/getDatabaseHosts';
import DatabaseHostRow from './DatabaseHostRow';
import { Group, TextInput, Title } from '@mantine/core';
import Table from '@/elements/Table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';

const DatabaseHostsContainer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { databaseHosts, setDatabaseHosts } = useAdminStore();

  const [loading, setLoading] = useState(databaseHosts.data.length === 0);
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
    getDatabaseHosts(page, search)
      .then((data) => {
        setDatabaseHosts(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Database Hosts
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            w={250}
          />
          <Button
            onClick={() => navigate('/admin/database-hosts/new')}
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
        <Table
          columns={['ID', 'Name', 'Type', 'Address', 'Databases', 'Locations']}
          pagination={databaseHosts}
          onPageSelect={setPage}
        >
          {databaseHosts.data.map((dh) => (
            <DatabaseHostRow key={dh.uuid} databaseHost={dh} />
          ))}
        </Table>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<DatabaseHostsContainer />} />
      <Route path={'/new'} element={<DatabaseHostCreateOrUpdate />} />
      <Route path={'/:id'} element={<DatabaseHostCreateOrUpdate />} />
    </Routes>
  );
};
