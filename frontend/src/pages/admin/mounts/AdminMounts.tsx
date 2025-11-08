import Spinner from '@/elements/Spinner';
import { Route, Routes, useNavigate } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import MountCreateOrUpdate from './MountCreateOrUpdate';
import MountRow, { mountTableColumns } from './MountRow';
import { Group, TextInput, Title } from '@mantine/core';
import Table from '@/elements/Table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Button from '@/elements/Button';
import getMounts from '@/api/admin/mounts/getMounts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import MountView from '@/pages/admin/mounts/MountView';

const MountsContainer = () => {
  const navigate = useNavigate();
  const { mounts, setMounts } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getMounts,
    setStoreData: setMounts,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Mounts
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/mounts/new')}
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
        <Table columns={mountTableColumns} pagination={mounts} onPageSelect={setPage}>
          {mounts.data.map((m) => (
            <MountRow key={m.uuid} mount={m} />
          ))}
        </Table>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<MountsContainer />} />
      <Route path={'/new'} element={<MountCreateOrUpdate />} />
      <Route path={'/:id/*'} element={<MountView />} />
    </Routes>
  );
};
