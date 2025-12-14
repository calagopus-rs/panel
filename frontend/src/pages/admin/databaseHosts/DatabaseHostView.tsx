import { faCog, faDatabase } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Route, Routes, useParams } from 'react-router';
import getDatabaseHost from '@/api/admin/database-hosts/getDatabaseHost.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Spinner from '@/elements/Spinner.tsx';
import SubNavigation from '@/elements/SubNavigation.tsx';
import AdminDatabaseHostDatabases from '@/pages/admin/databaseHosts/databases/AdminDatabaseHostDatabases.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import DatabaseHostCreateOrUpdate from './DatabaseHostCreateOrUpdate.tsx';

export default function DatabaseHostView() {
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
        <Route path='/' element={<DatabaseHostCreateOrUpdate contextDatabaseHost={databaseHost} />} />
        <Route path='/databases' element={<AdminDatabaseHostDatabases databaseHost={databaseHost} />} />
      </Routes>
    </>
  );
}
