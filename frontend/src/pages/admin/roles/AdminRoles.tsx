import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getRoles from '@/api/admin/roles/getRoles';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import RoleCreateOrUpdate from '@/pages/admin/roles/RoleCreateOrUpdate';
import RoleRow, { roleTableColumns } from '@/pages/admin/roles/RoleRow';
import RoleView from '@/pages/admin/roles/RoleView';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';

function RolesContainer() {
  const navigate = useNavigate();
  const { roles, setRoles } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getRoles,
    setStoreData: setRoles,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Roles
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/roles/new')}
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
        <Table columns={roleTableColumns} pagination={roles} onPageSelect={setPage}>
          {roles.data.map((role) => (
            <RoleRow key={role.uuid} role={role} />
          ))}
        </Table>
      )}
    </>
  );
}

export default function AdminRoles() {
  return (
    <Routes>
      <Route path={'/'} element={<RolesContainer />} />
      <Route path={'/new'} element={<RoleCreateOrUpdate />} />
      <Route path={'/:id/*'} element={<RoleView />} />
    </Routes>
  );
}
