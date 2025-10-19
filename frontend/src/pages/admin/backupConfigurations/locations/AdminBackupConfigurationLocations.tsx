import { getEmptyPaginationSet, httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Title } from '@mantine/core';
import { load } from '@/lib/debounce';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import NodeRow from '../../nodes/NodeRow';
import getBackupConfigurationNodes from '@/api/admin/backup-configurations/nodes/getBackupConfigurationNodes';
import LocationRow from '@/pages/admin/locations/LocationRow';
import getBackupConfigurationLocations from '@/api/admin/backup-configurations/locations/getBackupConfigurationLocations';

export default ({ backupConfiguration }: { backupConfiguration?: BackupConfiguration }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const [backupConfigurationLocations, setBackupConfigurationLocations] =
    useState<ResponseMeta<Location>>(getEmptyPaginationSet());

  const [loading, setLoading] = useState(backupConfigurationLocations.data.length === 0);
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
    getBackupConfigurationLocations(backupConfiguration.uuid, page, search)
      .then((data) => {
        setBackupConfigurationLocations(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <Title order={2}>Backup Configuration Locations</Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table
          columns={['Id', 'Name', 'Backup Disk', 'Created']}
          pagination={backupConfigurationLocations}
          onPageSelect={setPage}
        >
          {backupConfigurationLocations.data.map((location) => (
            <LocationRow key={location.uuid} location={location} />
          ))}
        </Table>
      )}
    </>
  );
};
