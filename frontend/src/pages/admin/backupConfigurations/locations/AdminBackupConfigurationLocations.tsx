import { getEmptyPaginationSet } from '@/api/axios';
import { useState } from 'react';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import LocationRow, { locationTableColumns } from '@/pages/admin/locations/LocationRow';
import getBackupConfigurationLocations from '@/api/admin/backup-configurations/locations/getBackupConfigurationLocations';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default ({ backupConfiguration }: { backupConfiguration?: BackupConfiguration }) => {
  const [backupConfigurationLocations, setBackupConfigurationLocations] = useState<ResponseMeta<Location>>(
    getEmptyPaginationSet(),
  );

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getBackupConfigurationLocations(backupConfiguration.uuid, page, search),
    setStoreData: setBackupConfigurationLocations,
  });

  return (
    <>
      <Title order={2} mb={'md'}>
        Backup Configuration Locations
      </Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={locationTableColumns} pagination={backupConfigurationLocations} onPageSelect={setPage}>
          {backupConfigurationLocations.data.map((location) => (
            <LocationRow key={location.uuid} location={location} />
          ))}
        </Table>
      )}
    </>
  );
};
