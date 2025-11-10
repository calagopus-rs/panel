import {
  faCodeCommit,
  faCog,
  faExternalLink,
  faFolder,
  faNetworkWired,
  faWrench,
} from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Route, Routes, useParams } from 'react-router';
import getServer from '@/api/admin/servers/getServer';
import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import SubNavigation from '@/elements/SubNavigation';
import AdminServerAllocations from '@/pages/admin/servers/allocations/AdminServerAllocations';
import AdminServerManagement from '@/pages/admin/servers/management/AdminServerManagement';
import AdminServerMounts from '@/pages/admin/servers/mounts/AdminServerMounts';
import AdminServerVariables from '@/pages/admin/servers/variables/AdminServerVariables';
import { useToast } from '@/providers/ToastProvider';
import ServerCreateOrUpdate from './ServerCreateOrUpdate';

export default function ServerView() {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const [server, setServer] = useState<AdminServer | null>(null);

  useEffect(() => {
    if (params.id) {
      getServer(params.id)
        .then((server) => {
          setServer(server);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  return !server ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{server.name}</Title>

      <SubNavigation
        items={[
          {
            name: 'General',
            icon: faCog,
            link: `/admin/servers/${params.id}`,
          },
          {
            name: 'Allocations',
            icon: faNetworkWired,
            link: `/admin/servers/${params.id}/allocations`,
          },
          {
            name: 'Variables',
            icon: faCodeCommit,
            link: `/admin/servers/${params.id}/variables`,
          },
          {
            name: 'Mounts',
            icon: faFolder,
            link: `/admin/servers/${params.id}/mounts`,
          },
          {
            name: 'Management',
            icon: faWrench,
            link: `/admin/servers/${params.id}/management`,
          },
          {
            name: 'View',
            icon: faExternalLink,
            link: `/server/${params.id}`,
          },
        ]}
      />

      <Routes>
        <Route path={'/'} element={<ServerCreateOrUpdate contextServer={server} />} />
        <Route path={'/allocations'} element={<AdminServerAllocations server={server} />} />
        <Route path={'/variables'} element={<AdminServerVariables server={server} />} />
        <Route path={'/mounts'} element={<AdminServerMounts server={server} />} />
        <Route path={'/management'} element={<AdminServerManagement server={server} />} />
      </Routes>
    </>
  );
}
