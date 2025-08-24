import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
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
import { load } from '@/lib/debounce';

const LocationsContainer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { locations, setLocations } = useAdminStore();

  const [loading, setLoading] = useState(locations.data.length === 0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getLocations(page, search)
      .then((data) => {
        setLocations(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Locations
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
          <Button onClick={() => navigate('/admin/locations/new')} color={'blue'}>
            <FontAwesomeIcon icon={faPlus} className={'mr-2'} />
            Create
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table
          columns={['Id', 'Short Name', 'Long Name', 'Backup Disk', 'Nodes']}
          pagination={locations}
          onPageSelect={setPage}
        >
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
      <Route path={'/:id'} element={<LocationCreateOrUpdate />} />
    </Routes>
  );
};
