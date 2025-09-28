import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import { useAdminStore } from '@/stores/admin';
import getLocationDatabaseHosts from '@/api/admin/locations/database-hosts/getLocationDatabaseHosts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import LocationDatabaseHostRow from './LocationDatabaseHostRow';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import LocationDatabaseHostCreateModal from './modals/LocationDatabaseHostCreateModal';

export default ({ location }: { location: Location }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { locationDatabaseHosts, setLocationDatabaseHosts } = useAdminStore();

  const [openModal, setOpenModal] = useState<'create'>(null);
  const [loading, setLoading] = useState(locationDatabaseHosts.data.length === 0);
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
    getLocationDatabaseHosts(location.uuid, page, search)
      .then((data) => {
        setLocationDatabaseHosts(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <LocationDatabaseHostCreateModal
        location={location}
        opened={openModal === 'create'}
        onClose={() => setOpenModal(null)}
      />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={2}>Location Database Hosts</Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('create')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table
            columns={['Id', 'Name', 'Type', 'Address', 'Added', '']}
            pagination={locationDatabaseHosts}
            onPageSelect={setPage}
          >
            {locationDatabaseHosts.data.map((databaseHost) => (
              <LocationDatabaseHostRow
                key={databaseHost.databaseHost.uuid}
                location={location}
                databaseHost={databaseHost}
              />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
