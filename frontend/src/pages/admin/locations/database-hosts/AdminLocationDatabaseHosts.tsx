import { useState } from 'react';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { useAdminStore } from '@/stores/admin';
import getLocationDatabaseHosts from '@/api/admin/locations/database-hosts/getLocationDatabaseHosts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import LocationDatabaseHostRow, { locationDatabaseHostTableColumns } from './LocationDatabaseHostRow';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import LocationDatabaseHostCreateModal from './modals/LocationDatabaseHostCreateModal';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default ({ location }: { location: Location }) => {
  const { locationDatabaseHosts, setLocationDatabaseHosts } = useAdminStore();

  const [openModal, setOpenModal] = useState<'create'>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getLocationDatabaseHosts(location.uuid, page, search),
    setStoreData: setLocationDatabaseHosts,
  });

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
          <Table columns={locationDatabaseHostTableColumns} pagination={locationDatabaseHosts} onPageSelect={setPage}>
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
