import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getBackupConfigurationLocations from '@/api/admin/backup-configurations/locations/getBackupConfigurationLocations.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { locationTableColumns } from '@/lib/tableColumns.ts';
import LocationRow from '@/pages/admin/locations/LocationRow.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';

export default function AdminBackupConfigurationLocations({
  backupConfiguration,
}: {
  backupConfiguration: BackupConfiguration;
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
