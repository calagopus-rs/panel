import { httpErrorToHuman } from '@/api/axios';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import DatabaseHostCreateOrUpdate from './DatabaseHostCreateOrUpdate';
import getDatabaseHosts from '@/api/admin/databaseHosts/getDatabaseHosts';
import DatabaseHostRow from './DatabaseHostRow';
import { Group, TextInput, Title } from '@mantine/core';
import TableNew from '@/elements/table/TableNew';

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
        setLoading(false);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <Container>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Database Hosts
        </Title>
        <TextInput
          placeholder={'Search activities...'}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={250}
        />
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <TableNew
          columns={['ID', 'Name', 'Type', 'Address', 'Databases', 'Locations']}
          pagination={databaseHosts}
          onPageSelect={setPage}
        >
          {databaseHosts.data.map((dh) => (
            <DatabaseHostRow key={dh.uuid} databaseHost={dh} />
          ))}
        </TableNew>
      )}
    </Container>
  );
};

export default () => {
  return (
    <Container>
      <Routes>
        <Route path={'/'} element={<DatabaseHostsContainer />} />
        <Route path={'/new'} element={<DatabaseHostCreateOrUpdate />} />
        <Route path={'/:id'} element={<DatabaseHostCreateOrUpdate />} />
      </Routes>
    </Container>
  );
};
