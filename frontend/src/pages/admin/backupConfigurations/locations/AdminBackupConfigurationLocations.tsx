import { useState } from 'react';
import getBackupConfigurationLocations from '@/api/admin/backup-configurations/locations/getBackupConfigurationLocations.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
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
    <AdminContentContainer title={`Backup Config Locations`} titleOrder={2} search={search} setSearch={setSearch}>
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
    </AdminContentContainer>
  );
}
