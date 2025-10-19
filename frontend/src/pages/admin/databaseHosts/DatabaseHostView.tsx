import { Route, Routes, useParams } from 'react-router';
import SubNavigation from '@/elements/SubNavigation';
import { faCog, faDatabase } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import DatabaseHostCreateOrUpdate from './DatabaseHostCreateOrUpdate';
import AdminDatabaseHostDatabases from '@/pages/admin/databaseHosts/databases/AdminDatabaseHostDatabases';
import getDatabaseHost from '@/api/admin/database-hosts/getDatabaseHost';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const [databaseHost, setDatabaseHost] = useState<AdminDatabaseHost | null>(null);

  useEffect(() => {
    if (params.id) {
      getDatabaseHost(params.id)
        .then((databaseHost) => {
          setDatabaseHost(databaseHost);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  return !databaseHost ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{databaseHost.name}</Title>

      <SubNavigation
        items={[
          {
            name: 'General',
            icon: faCog,
            link: `/admin/database-hosts/${params.id}`,
          },
          {
            name: 'Databases',
            icon: faDatabase,
            link: `/admin/database-hosts/${params.id}/databases`,
          },
        ]}
      />

      <Routes>
        <Route path={'/'} element={<DatabaseHostCreateOrUpdate contextDatabaseHost={databaseHost} />} />
        <Route path={'/databases'} element={<AdminDatabaseHostDatabases databaseHost={databaseHost} />} />
      </Routes>
    </>
  );
};
