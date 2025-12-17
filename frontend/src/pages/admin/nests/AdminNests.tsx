import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getNests from '@/api/admin/nests/getNests.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { nestTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import NestCreateOrUpdate from './NestCreateOrUpdate.tsx';
import NestRow from './NestRow.tsx';
import NestView from './NestView.tsx';

function NestsContainer() {
  const navigate = useNavigate();
  const { nests, setNests } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getNests,
    setStoreData: setNests,
  });

  return (
    <AdminContentContainer
      title='Nests'
      search={search}
      setSearch={setSearch}
      contentRight={
        <Button
          onClick={() => navigate('/admin/nests/new')}
          color='blue'
          leftSection={<FontAwesomeIcon icon={faPlus} />}
        >
          Create
        </Button>
      }
    >
      <Table columns={nestTableColumns} loading={loading} pagination={nests} onPageSelect={setPage}>
        {nests.data.map((nest) => (
          <NestRow key={nest.uuid} nest={nest} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}

export default function AdminNests() {
  return (
    <Routes>
      <Route path='/' element={<NestsContainer />} />
      <Route path='/new' element={<NestCreateOrUpdate />} />
      <Route path='/:nestId/*' element={<NestView />} />
    </Routes>
  );
}
