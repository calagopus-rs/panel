import Spinner from '@/elements/Spinner';
import { Route, Routes, useNavigate } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import NestRow from './NestRow';
import getNests from '@/api/admin/nests/getNests';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import NestCreateOrUpdate from './NestCreateOrUpdate';
import NestView from './NestView';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

const NestsContainer = () => {
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

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={['ID', 'Name', 'Author', 'Description', 'Created']} pagination={nests} onPageSelect={setPage}>
          {nests.data.map((nest) => (
            <NestRow key={nest.uuid} nest={nest} />
          ))}
        </Table>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<NestsContainer />} />
      <Route path={'/new'} element={<NestCreateOrUpdate />} />
      <Route path={'/:nestId/*'} element={<NestView />} />
    </Routes>
  );
};
