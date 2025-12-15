import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getLocationDatabaseHosts from '@/api/admin/locations/database-hosts/getLocationDatabaseHosts.ts';
import Button from '@/elements/Button.tsx';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { locationDatabaseHostTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import LocationDatabaseHostRow from './LocationDatabaseHostRow.tsx';
import LocationDatabaseHostCreateModal from './modals/LocationDatabaseHostCreateModal.tsx';

export default function AdminLocationDatabaseHosts({ location }: { location: Location }) {
  const { locationDatabaseHosts, setLocationDatabaseHosts } = useAdminStore();

  const [openModal, setOpenModal] = useState<'create' | null>(null);

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

      <Group justify='space-between' align='start' mb='md'>
        <Title order={2}>Location Database Hosts</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('create')} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create
          </Button>
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table
          columns={locationDatabaseHostTableColumns}
          loading={loading}
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
    </>
  );
}
