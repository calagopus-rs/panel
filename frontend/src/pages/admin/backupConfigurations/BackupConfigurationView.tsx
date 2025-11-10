import { faChartBar, faCog, faDesktop, faEarthAmerica, faServer } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Route, Routes, useParams } from 'react-router';
import getBackupConfiguration from '@/api/admin/backup-configurations/getBackupConfiguration';
import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import SubNavigation from '@/elements/SubNavigation';
import AdminBackupConfigurationLocations from '@/pages/admin/backupConfigurations/locations/AdminBackupConfigurationLocations';
import AdminBackupConfigurationNodes from '@/pages/admin/backupConfigurations/nodes/AdminBackupConfigurationNodes';
import AdminBackupConfigurationServers from '@/pages/admin/backupConfigurations/servers/AdminBackupConfigurationServers';
import AdminBackupConfigurationStats from '@/pages/admin/backupConfigurations/stats/AdminBackupConfigurationStats';
import { useToast } from '@/providers/ToastProvider';
import BackupConfigurationCreateOrUpdate from './BackupConfigurationCreateOrUpdate';

export default function BackupConfigurationView() {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const [backupConfiguration, setBackupConfiguration] = useState<BackupConfiguration | null>(null);

  useEffect(() => {
    if (params.id) {
      getBackupConfiguration(params.id)
        .then((backupConfig) => {
          setBackupConfiguration(backupConfig);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  return !backupConfiguration ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{backupConfiguration.name}</Title>

      <SubNavigation
        items={[
          {
            name: 'General',
            icon: faCog,
            link: `/admin/backup-configurations/${params.id}`,
          },
          {
            name: 'Stats',
            icon: faChartBar,
            link: `/admin/backup-configurations/${params.id}/stats`,
          },
          {
            name: 'Locations',
            icon: faEarthAmerica,
            link: `/admin/backup-configurations/${params.id}/locations`,
          },
          {
            name: 'Nodes',
            icon: faServer,
            link: `/admin/backup-configurations/${params.id}/nodes`,
          },
          {
            name: 'Servers',
            icon: faDesktop,
            link: `/admin/backup-configurations/${params.id}/servers`,
          },
        ]}
      />

      <Routes>
        <Route
          path={'/'}
          element={<BackupConfigurationCreateOrUpdate contextBackupConfiguration={backupConfiguration} />}
        />
        <Route path={'/stats'} element={<AdminBackupConfigurationStats backupConfiguration={backupConfiguration} />} />
        <Route
          path={'/locations'}
          element={<AdminBackupConfigurationLocations backupConfiguration={backupConfiguration} />}
        />
        <Route path={'/nodes'} element={<AdminBackupConfigurationNodes backupConfiguration={backupConfiguration} />} />
        <Route
          path={'/servers'}
          element={<AdminBackupConfigurationServers backupConfiguration={backupConfiguration} />}
        />
      </Routes>
    </>
  );
}
