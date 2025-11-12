import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getNests from '@/api/admin/nests/getNests';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';
import NestCreateOrUpdate from './NestCreateOrUpdate';
import NestRow, { nestTableColumns } from './NestRow';
import NestView from './NestView';

function NestsContainer() {
  const navigate = useNavigate();
  const { nests, setNests } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getNests,
    setStoreData: setNests,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Nests
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/nests/new')}
            color={'blue'}
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      <Table columns={nestTableColumns} loading={loading} pagination={nests} onPageSelect={setPage}>
        {nests.data.map((nest) => (
          <NestRow key={nest.uuid} nest={nest} />
        ))}
      </Table>
    </>
  );
}

export default function AdminNests() {
  return (
    <Routes>
      <Route path={'/'} element={<NestsContainer />} />
      <Route path={'/new'} element={<NestCreateOrUpdate />} />
      <Route path={'/:nestId/*'} element={<NestView />} />
    </Routes>
  );
}
