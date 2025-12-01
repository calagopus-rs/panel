import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getBackupConfigurationLocations from '@/api/admin/backup-configurations/locations/getBackupConfigurationLocations';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import LocationRow, { locationTableColumns } from '@/pages/admin/locations/LocationRow';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import TextInput from '@/elements/input/TextInput';

export default function AdminBackupConfigurationLocations({
  backupConfiguration,
}: {
  backupConfiguration?: BackupConfiguration;
}) {
  const [backupConfigurationLocations, setBackupConfigurationLocations] = useState<ResponseMeta<Location>>(
    getEmptyPaginationSet(),
  );

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getBackupConfigurationLocations(backupConfiguration.uuid, page, search),
    setStoreData: setBackupConfigurationLocations,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={2}>Backup Configuration Locations</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      <Table
        columns={locationTableColumns}
        loading={loading}
        pagination={backupConfigurationLocations}
        onPageSelect={setPage}
      >
        {backupConfigurationLocations.data.map((location) => (
          <LocationRow key={location.uuid} location={location} />
        ))}
      </Table>
    </>
  );
}
