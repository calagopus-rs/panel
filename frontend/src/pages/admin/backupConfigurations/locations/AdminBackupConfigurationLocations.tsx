import { Title } from '@mantine/core';
import { useState } from 'react';
import getBackupConfigurationLocations from '@/api/admin/backup-configurations/locations/getBackupConfigurationLocations';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import { locationTableColumns } from '@/lib/tableColumns';
import LocationRow from '@/pages/admin/locations/LocationRow';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default function AdminBackupConfigurationLocations({
  backupConfiguration,
}: {
  backupConfiguration: BackupConfiguration;
}) {
  const [backupConfigurationLocations, setBackupConfigurationLocations] = useState<ResponseMeta<Location>>(
    getEmptyPaginationSet(),
  );

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getBackupConfigurationLocations(backupConfiguration.uuid, page, search),
    setStoreData: setBackupConfigurationLocations,
  });

  return (
    <>
      <Title order={2} mb='md'>
        Backup Configuration Locations
      </Title>

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
