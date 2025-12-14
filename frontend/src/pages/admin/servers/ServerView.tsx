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
import getServer from '@/api/admin/servers/getServer.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Spinner from '@/elements/Spinner.tsx';
import SubNavigation from '@/elements/SubNavigation.tsx';
import AdminServerAllocations from '@/pages/admin/servers/allocations/AdminServerAllocations.tsx';
import AdminServerManagement from '@/pages/admin/servers/management/AdminServerManagement.tsx';
import AdminServerMounts from '@/pages/admin/servers/mounts/AdminServerMounts.tsx';
import ServerUpdate from '@/pages/admin/servers/ServerUpdate.tsx';
import AdminServerVariables from '@/pages/admin/servers/variables/AdminServerVariables.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';

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
        <Route path='/' element={<ServerUpdate contextServer={server} />} />
        <Route path='/allocations' element={<AdminServerAllocations server={server} />} />
        <Route path='/variables' element={<AdminServerVariables server={server} />} />
        <Route path='/mounts' element={<AdminServerMounts server={server} />} />
        <Route path='/management' element={<AdminServerManagement server={server} />} />
      </Routes>
    </>
  );
}
