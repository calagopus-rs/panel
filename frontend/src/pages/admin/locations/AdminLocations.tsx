import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getLocations from '@/api/admin/locations/getLocations';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { locationTableColumns } from '@/lib/tableColumns';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';
import LocationCreateOrUpdate from './LocationCreateOrUpdate';
import LocationRow from './LocationRow';
import LocationView from './LocationView';

function LocationsContainer() {
  const navigate = useNavigate();
  const { locations, setLocations } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getLocations,
    setStoreData: setLocations,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          Locations
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/locations/new')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      <Table columns={locationTableColumns} loading={loading} pagination={locations} onPageSelect={setPage}>
        {locations.data.map((location) => (
          <LocationRow key={location.uuid} location={location} />
        ))}
      </Table>
    </>
  );
}

export default function AdminLocations() {
  return (
    <Routes>
      <Route path='/' element={<LocationsContainer />} />
      <Route path='/new' element={<LocationCreateOrUpdate />} />
      <Route path='/:id/*' element={<LocationView />} />
    </Routes>
  );
}
