import { Route, Routes, useParams } from 'react-router';
import SubNavigation from '@/elements/SubNavigation';
import { faCog, faExternalLink, faNetworkWired } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import getServer from '@/api/admin/servers/getServer';
import ServerCreateOrUpdate from './ServerCreateOrUpdate';
import AdminServerAllocations from "@/pages/admin/servers/allocations/AdminServerAllocations";
import AdminServerMounts from "@/pages/admin/servers/mounts/AdminServerMounts";

export default () => {
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
            name: 'Mounts',
            icon: faExternalLink,
            link: `/admin/servers/${params.id}/mounts`,
          },
        ]}
      />

      <Routes>
        <Route path={'/'} element={<ServerCreateOrUpdate contextServer={server} />} />
        <Route path={'/allocations'} element={<AdminServerAllocations server={server} />} />
        <Route path={'/mounts'} element={<AdminServerMounts server={server} />} />
      </Routes>
    </>
  );
};
