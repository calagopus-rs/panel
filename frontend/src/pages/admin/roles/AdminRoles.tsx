import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getRoles from '@/api/admin/roles/getRoles.ts';
import Button from '@/elements/Button.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { roleTableColumns } from '@/lib/tableColumns.ts';
import RoleCreateOrUpdate from '@/pages/admin/roles/RoleCreateOrUpdate.tsx';
import RoleRow from '@/pages/admin/roles/RoleRow.tsx';
import RoleView from '@/pages/admin/roles/RoleView.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';

function RolesContainer() {
  const navigate = useNavigate();
  const { roles, setRoles } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getRoles,
    setStoreData: setRoles,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          Roles
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/roles/new')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      <Table columns={roleTableColumns} loading={loading} pagination={roles} onPageSelect={setPage}>
        {roles.data.map((role) => (
          <RoleRow key={role.uuid} role={role} />
        ))}
      </Table>
    </>
  );
}

export default function AdminRoles() {
  return (
    <Routes>
      <Route path='/' element={<RolesContainer />} />
      <Route path='/new' element={<RoleCreateOrUpdate />} />
      <Route path='/:id/*' element={<RoleView />} />
    </Routes>
  );
}
