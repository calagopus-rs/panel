import Spinner from '@/elements/Spinner';
import { Route, Routes, useNavigate } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import getLocations from '@/api/admin/locations/getLocations';
import LocationRow from './LocationRow';
import LocationCreateOrUpdate from './LocationCreateOrUpdate';
import { Group, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import TextInput from '@/elements/input/TextInput';
import LocationView from './LocationView';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

const LocationsContainer = () => {
  const navigate = useNavigate();
  const { locations, setLocations } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getLocations,
    setStoreData: setLocations,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Locations
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/locations/new')}
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
        <Table columns={['Id', 'Name', 'Backup Disk', 'Created']} pagination={locations} onPageSelect={setPage}>
          {locations.data.map((location) => (
            <LocationRow key={location.uuid} location={location} />
          ))}
        </Table>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<LocationsContainer />} />
      <Route path={'/new'} element={<LocationCreateOrUpdate />} />
      <Route path={'/:id/*'} element={<LocationView />} />
    </Routes>
  );
};
