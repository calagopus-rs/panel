import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, TextInput, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getMounts from '@/api/admin/mounts/getMounts.ts';
import Button from '@/elements/Button.tsx';
import Table from '@/elements/Table.tsx';
import { mountTableColumns } from '@/lib/tableColumns.ts';
import MountView from '@/pages/admin/mounts/MountView.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import MountCreateOrUpdate from './MountCreateOrUpdate.tsx';
import MountRow from './MountRow.tsx';

function MountsContainer() {
  const navigate = useNavigate();
  const { mounts, setMounts } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getMounts,
    setStoreData: setMounts,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          Mounts
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/mounts/new')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      <Table columns={mountTableColumns} loading={loading} pagination={mounts} onPageSelect={setPage}>
        {mounts.data.map((m) => (
          <MountRow key={m.uuid} mount={m} />
        ))}
      </Table>
    </>
  );
}

export default function AdminMounts() {
  return (
    <Routes>
      <Route path='/' element={<MountsContainer />} />
      <Route path='/new' element={<MountCreateOrUpdate />} />
      <Route path='/:id/*' element={<MountView />} />
    </Routes>
  );
}
