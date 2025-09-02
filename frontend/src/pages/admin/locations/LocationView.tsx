import { Route, Routes, useParams } from 'react-router';
import { SubNavigation, SubNavigationLink } from '@/elements/SubNavigation';
import { faCog, faDatabase, faServer } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import getLocation from '@/api/admin/locations/getLocation';
import LocationCreateOrUpdate from './LocationCreateOrUpdate';
import AdminLocationDatabaseHosts from './database-hosts/AdminLocationDatabaseHosts';
import AdminLocationNodes from './nodes/AdminLocationNodes';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (params.id) {
      getLocation(params.id)
        .then((location) => {
          setLocation(location);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  return !location ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{location.name}</Title>

      <SubNavigation>
        <SubNavigationLink to={`/admin/locations/${params.id}`} name={'General'} icon={faCog} />
        <SubNavigationLink
          to={`/admin/locations/${params.id}/database-hosts`}
          name={'Database Hosts'}
          icon={faDatabase}
          end={false}
        />
        <SubNavigationLink to={`/admin/locations/${params.id}/nodes`} name={'Nodes'} icon={faServer} end={false} />
      </SubNavigation>

      <Routes>
        <Route path={'/'} element={<LocationCreateOrUpdate contextLocation={location} />} />
        <Route path={'/database-hosts'} element={<AdminLocationDatabaseHosts location={location} />} />
        <Route path={'/nodes'} element={<AdminLocationNodes location={location} />} />
      </Routes>
    </>
  );
};
