import Spinner from '@/elements/Spinner';
import { Route, Routes, useNavigate } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import { Group, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import TextInput from '@/elements/input/TextInput';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import getRoles from '@/api/admin/roles/getRoles';
import RoleRow, { roleTableColumns } from '@/pages/admin/roles/RoleRow';
import RoleCreateOrUpdate from '@/pages/admin/roles/RoleCreateOrUpdate';
import RoleView from '@/pages/admin/roles/RoleView';

const RolesContainer = () => {
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
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<RolesContainer />} />
      <Route path={'/new'} element={<RoleCreateOrUpdate />} />
      <Route path={'/:id/*'} element={<RoleView />} />
    </Routes>
  );
};
